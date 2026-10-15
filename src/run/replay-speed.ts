import type { RunTimelineStep } from './run-transcript';

export type ReplaySpeed = 'smart' | '1' | '2' | '4' | '8';

/** Smart mode preserves two seconds around recorded step boundaries at normal speed. */
export function replayRate(speed: ReplaySpeed, offsetMs: number, timeline: readonly RunTimelineStep[]): number {
  if (speed !== 'smart') return Number(speed);
  if (timeline.length === 0 || !Number.isFinite(offsetMs)) return 1;
  const boundaries = timeline.flatMap(step => [step.replayOffsetMs, step.completedReplayOffsetMs])
    .filter((offset): offset is number => offset !== null && Number.isFinite(offset));
  if (boundaries.length === 0) return 1;
  return boundaries.some(boundary => Math.abs(boundary - offsetMs) <= 2_000) ? 1 : 4;
}
