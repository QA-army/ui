import type { RunEvent, RunOutcome } from "./model";
import { displayRunEventLabel } from "./run-presentation";

export interface TranscriptActivity {
  readonly verification?: { readonly expectation: string; readonly observed: string | null; readonly inferred: boolean; readonly journey?: {readonly captured: readonly {name:string;value:string|number|boolean}[];readonly checked: readonly {name:string;value:string|number|boolean}[]} };
  readonly id: string;
  readonly kind: "action" | "assertion";
  readonly type: string;
  readonly label: string;
  readonly outcome: RunOutcome | null;
  readonly sequence: number;
  readonly replayOffsetMs: number | null;
  readonly eventId: string;
}

export interface TranscriptAttempt {
  readonly attempt: number;
  readonly stepEventId: string;
  readonly startedEventId: string;
  readonly outcome: RunOutcome | "STARTED" | null;
  readonly elapsedMs: number;
  readonly replayOffsetMs: number | null;
  readonly completedReplayOffsetMs: number | null;
  readonly activities: readonly TranscriptActivity[];
}

export interface TranscriptStep {
  readonly stepId: string;
  readonly position: number;
  readonly title: string;
  readonly stepType: string;
  readonly enabled: boolean;
  readonly attempts: readonly TranscriptAttempt[];
}

export interface TranscriptPlanStep {
  readonly id: string;
  readonly position: number;
  readonly type: string;
  readonly instruction: string;
  readonly enabled: boolean;
}

export interface RunTimelineStep {
  readonly stepId: string;
  readonly attempt: number;
  readonly eventId: string;
  readonly position: number;
  readonly title: string;
  readonly outcome: RunOutcome | "STARTED";
  readonly replayOffsetMs: number;
  readonly completedReplayOffsetMs: number | null;
  readonly detail: string | null;
}

/**
 * Customer transcript projection for run-event.v2.
 *
 * Saved steps are the stable outer rows. Attempts are nested beneath each step,
 * and each action/assertion identity produces one visible row. A COMPLETED event
 * replaces its STARTED representation; separate action IDs are never collapsed.
 */
export function projectTranscript(
  events: readonly RunEvent[],
  planSteps: readonly TranscriptPlanStep[] = [],
): readonly TranscriptStep[] {
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence);
  const stepSnapshots = new Map<string, { position: number; title: string; stepType: string; enabled: boolean }>();
  const attempts = new Map<string, MutableAttempt>();

  for (const step of planSteps) {
    stepSnapshots.set(step.id, {
      position: step.position + 1,
      title: step.instruction,
      stepType: step.type.toUpperCase(),
      enabled: step.enabled,
    });
  }

  for (const event of ordered) {
    const stepId = event.correlation.stepId;
    if (event.kind === "step.state" && stepId && event.attempt !== null) {
      const step = readStepSnapshot(event.safePayload);
      if (!step) continue;
      stepSnapshots.set(stepId, step);
      const key = attemptKey(stepId, event.attempt);
      const current = attempts.get(key) ?? {
        attempt: event.attempt, stepEventId: event.eventId, startedEventId: event.eventId,
        outcome: null, elapsedMs: event.elapsedMs,
        replayOffsetMs: event.replayOffsetMs, completedReplayOffsetMs: null,
        activities: new Map<string, TranscriptActivity>(),
      };
      current.stepEventId = event.eventId;
      current.elapsedMs = event.elapsedMs;
      if (event.type === "STARTED") {
        current.startedEventId = event.eventId;
        current.replayOffsetMs = event.replayOffsetMs;
      } else {
        current.completedReplayOffsetMs = event.replayOffsetMs;
      }
      current.outcome = event.type === "STARTED" ? "STARTED" : event.outcome;
      attempts.set(key, current);
      continue;
    }

    if ((event.kind === "action" || event.kind === "assertion") && stepId && event.attempt !== null) {
      const identity = event.kind === "action" ? event.correlation.actionId : event.correlation.assertionId;
      if (!identity) continue;
      const key = attemptKey(stepId, event.attempt);
      const current = attempts.get(key);
      if (!current) continue;
      const existing = current.activities.get(identity);
      if (existing && existing.outcome !== null && event.phase !== "COMPLETED") continue;
      current.activities.set(identity, {
        id: identity,
        kind: event.kind,
        type: event.type,
        label: activityLabel(event),
        ...(event.kind === "assertion" && typeof event.safePayload.expectation === "string" ? { verification: {
          ...(event.safePayload.journey ? {journey:event.safePayload.journey as NonNullable<NonNullable<TranscriptActivity["verification"]>["journey"]>} : {}),
          expectation: event.safePayload.expectation,
          observed: typeof event.safePayload.actual_summary === "string" ? event.safePayload.actual_summary : null,
          inferred: Boolean(event.safePayload.provenance && typeof event.safePayload.provenance === "object"
            && (event.safePayload.provenance as Record<string, unknown>).origin === "INFERRED"),
        } } : {}),
        outcome: event.outcome,
        sequence: existing?.sequence ?? event.sequence,
        replayOffsetMs: event.replayOffsetMs ?? existing?.replayOffsetMs ?? null,
        eventId: event.eventId,
      });
    }
  }

  return [...stepSnapshots.entries()]
    .map(([stepId, snapshot]) => ({
      stepId,
      ...snapshot,
      attempts: [...attempts.entries()]
        .filter(([key]) => key.startsWith(`${stepId}:`))
        .map(([, attempt]) => ({
          attempt: attempt.attempt,
          stepEventId: attempt.stepEventId,
          startedEventId: attempt.startedEventId,
          outcome: attempt.outcome,
          elapsedMs: attempt.elapsedMs,
          replayOffsetMs: attempt.replayOffsetMs,
          completedReplayOffsetMs: attempt.completedReplayOffsetMs,
          activities: [...attempt.activities.values()].sort((left, right) => left.sequence - right.sequence),
        }))
        .sort((left, right) => left.attempt - right.attempt),
    }))
    .sort((left, right) => left.position - right.position || left.stepId.localeCompare(right.stepId));
}

/**
 * Customer-facing video timeline derived from the canonical transcript.
 *
 * A step's start offset is its stable jump point. Its completed outcome turns
 * that point into an achievement stamp; retries collapse to the latest attempt
 * so the replay never invents a second source of Run truth.
 */
export function projectRunTimeline(events: readonly RunEvent[]): readonly RunTimelineStep[] {
  return projectTranscript(events).flatMap((step) => {
    const attempt = step.attempts.at(-1);
    if (!attempt || attempt.replayOffsetMs === null || attempt.outcome === null || attempt.outcome === "SKIPPED") return [];
    const activity = attempt.activities.at(-1);
    return [{
      stepId: step.stepId,
      attempt: attempt.attempt,
      eventId: attempt.startedEventId,
      position: step.position,
      title: step.title,
      outcome: attempt.outcome,
      replayOffsetMs: attempt.replayOffsetMs,
      completedReplayOffsetMs: attempt.completedReplayOffsetMs,
      detail: activity?.label ?? null,
    }];
  });
}

interface MutableAttempt {
  attempt: number;
  stepEventId: string;
  startedEventId: string;
  outcome: RunOutcome | "STARTED" | null;
  elapsedMs: number;
  replayOffsetMs: number | null;
  completedReplayOffsetMs: number | null;
  activities: Map<string, TranscriptActivity>;
}

function attemptKey(stepId: string, attempt: number): string { return `${stepId}:${attempt}`; }

function readStepSnapshot(payload: Readonly<Record<string, unknown>>) {
  const value = payload.step;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const step = value as Record<string, unknown>;
  if (!Number.isSafeInteger(step.position) || typeof step.title !== "string"
    || typeof step.type !== "string" || typeof step.enabled !== "boolean") return undefined;
  return { position: step.position as number, title: step.title, stepType: step.type, enabled: step.enabled };
}

function activityLabel(event: RunEvent): string {
  return displayRunEventLabel(event);
}
