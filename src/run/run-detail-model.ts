import type { Run, RunEvent } from "./model";
import type { TranscriptActivity, TranscriptStep } from "./run-transcript";

export function resultSummary(events: readonly RunEvent[], steps: readonly TranscriptStep[]) {
  const final = [...events].reverse().find((event) => event.kind === "result.final");
  if (final) {
    return {
      passedSteps: numericPayload(final, "passed_steps"),
      failedSteps: numericPayload(final, "failed_steps"),
      errorSteps: numericPayload(final, "error_steps"),
    };
  }
  const outcomes = steps.map((step) => step.attempts.at(-1)?.outcome);
  return {
    passedSteps: outcomes.filter((outcome) => outcome === "PASSED").length,
    failedSteps: outcomes.filter((outcome) => outcome === "FAILED").length,
    errorSteps: outcomes.filter((outcome) => outcome === "ERROR").length,
  };
}

export function numericPayload(event: RunEvent, key: string) {
  const value = event.safePayload[key];
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function activityIcon(activity: TranscriptActivity) {
  if (activity.outcome === "FAILED") return "×";
  if (activity.outcome === "ERROR") return "!";
  if (activity.outcome === "CANCELLED") return "–";
  if (activity.kind === "assertion") return activity.outcome === "PASSED" ? "✓" : "◉";
  if (activity.type === "SCROLL" || activity.type === "SWIPE") return "↕";
  if (activity.type === "WAIT") return "◷";
  if (activity.type.startsWith("CAPTURE")) return "⌕";
  return "›";
}

export function isTerminalStatus(status: Run["status"]) {
  return ["PASSED", "FLAKY", "FAILED", "ERROR", "CANCELLED", "MOCKED"].includes(status);
}

export function finalDuration(events: readonly RunEvent[]) {
  return [...events].reverse().find((event) => event.kind === "result.final")?.elapsedMs
    ?? events.at(-1)?.elapsedMs
    ?? 0;
}

export function formatDuration(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1_000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(date);
}
