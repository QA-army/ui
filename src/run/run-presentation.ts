import type { Run, RunEvent } from "./model";

/**
 * Presentation-only copy for historic provider-branded Run records.
 *
 * Run events are immutable evidence, so this deliberately leaves their stored
 * payloads untouched and derives a neutral label at the Web UI boundary.
 */
export function displayRunEventLabel(event: RunEvent): string {
  const summary = text(event.safePayload.summary);
  if (summary && !containsLegacyProviderName(summary)) return summary;

  if (!summary) {
    for (const key of ["expectation", "actual_summary"]) {
      const value = text(event.safePayload[key]);
      if (value) return value;
    }
  }
  return fallbackEventLabel(event);
}

export function displayRunOutcomeSummary(run: Pick<Run, "status" | "outcomeSummary">): string | null {
  const summary = run.outcomeSummary?.trim();
  if (!summary) return null;
  return containsLegacyProviderName(summary) ? fallbackOutcomeLabel(run.status) : summary;
}

function fallbackEventLabel(event: RunEvent): string {
  if (event.kind === "action") return actionLabel(event);
  if (event.kind === "assertion") return assertionLabel(event);
  if (event.kind === "step.state") return stepLabel(event);
  if (event.kind === "browser.state") return browserLabel(event);
  if (event.kind === "evidence.ready") return "Run evidence is available.";
  if (event.kind === "result.final") return fallbackOutcomeLabel(event.outcome ?? "ERROR");
  if (event.kind === "run.state") return `Run is ${event.state?.toLowerCase() ?? "updating"}.`;
  if (event.kind === "attempt.state") return event.phase === "COMPLETED"
    ? "Run attempt completed."
    : "Run attempt started.";
  return "Run activity recorded.";
}

function actionLabel(event: RunEvent): string {
  const copy = actionCopy[event.type] ?? {
    started: "Performing the saved Test action.",
    passed: "Saved Test action completed.",
    error: "The saved Test action could not be completed reliably.",
  };
  if (event.outcome === "ERROR") return copy.error;
  if (event.outcome === "CANCELLED") return "The saved Test action was cancelled.";
  return event.phase === "COMPLETED" ? copy.passed : copy.started;
}

function assertionLabel(event: RunEvent): string {
  if (event.outcome === "PASSED") return "Saved Test expectation passed.";
  if (event.outcome === "FAILED") return "Saved Test expectation failed.";
  if (event.outcome === "CANCELLED") return "Saved Test expectation was cancelled.";
  if (event.outcome === "ERROR") return "The saved Test expectation could not be evaluated reliably.";
  return "Checking the saved Test expectation.";
}

function stepLabel(event: RunEvent): string {
  if (event.type === "STARTED") return "Saved Test step started.";
  if (event.outcome === "PASSED") return "Saved Test step passed.";
  if (event.outcome === "FAILED") return "Saved Test step found a product failure.";
  if (event.outcome === "CANCELLED") return "Saved Test step was cancelled.";
  if (event.outcome === "SKIPPED") return "Saved Test step was skipped.";
  return "Saved Test step could not be completed reliably.";
}

function browserLabel(event: RunEvent): string {
  if (event.type === "LOADING_READY") return "Verified the deterministic loading marker.";
  if (event.type === "PAGE_NAVIGATED") return "Opened the server-resolved saved Test target.";
  if (event.type === "LIVE_VIEW_READY") return "Live browser view is ready.";
  return "Browser state updated.";
}

function fallbackOutcomeLabel(status: Run["status"] | NonNullable<RunEvent["outcome"]>): string {
  if (status === "PASSED") return "All enabled saved-Test steps passed.";
  if (status === "FAILED") return "A saved-Test assertion found a product failure.";
  if (status === "CANCELLED") return "Run cancelled and isolated execution sessions stopped.";
  if (status === "SKIPPED") return "Saved Test steps were skipped.";
  if (["READY", "QUEUED", "PROVISIONING", "RUNNING"].includes(status)) return `Run is ${status.toLowerCase()}.`;
  return "The saved Test result could not be determined reliably.";
}

const actionCopy: Readonly<Record<string, { readonly started: string; readonly passed: string; readonly error: string }>> = {
  NAVIGATE: {
    started: "Opening a page.", passed: "Opened a page.", error: "A page could not be opened reliably.",
  },
  CAPTURE_SCREENSHOT: {
    started: "Capturing a screenshot.", passed: "Captured a screenshot.", error: "A screenshot could not be captured reliably.",
  },
  SCROLL: {
    started: "Scrolling the page.", passed: "Scrolled the page.", error: "The page could not be scrolled reliably.",
  },
  CLICK: {
    started: "Clicking a page element.", passed: "Clicked a page element.", error: "A page element could not be clicked reliably.",
  },
  TYPE: {
    started: "Entering text.", passed: "Entered text.", error: "Text could not be entered reliably.",
  },
  HOVER: {
    started: "Inspecting a page element.", passed: "Inspected a page element.", error: "A page element could not be inspected reliably.",
  },
  WAIT: {
    started: "Waiting for the page to respond.", passed: "The page responded.", error: "The page did not respond reliably.",
  },
};

function containsLegacyProviderName(value: string): boolean { return /nova(?:\b|_)/i.test(value); }
function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value : null; }
