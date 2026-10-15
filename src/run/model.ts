/** View of a Run the open page can render. The hosted service fills this in. */

export type RunStatus = "READY" | "QUEUED" | "PROVISIONING" | "RUNNING" | "PASSED" | "FLAKY" | "FAILED" | "ERROR" | "CANCELLED" | "MOCKED";
export type RunOutcome = "PASSED" | "FAILED" | "ERROR" | "CANCELLED" | "SKIPPED";
export type RunConnection = "connected" | "refreshing" | "reconnecting";

export interface RunJourneySource {
  readonly fragment_id: string;
  readonly test_id: string;
  readonly test_version: number | string;
  readonly primitive: string;
}

export interface RunJourney {
  readonly goal: string;
  readonly unresolved_prerequisites: readonly string[];
  readonly sources: readonly RunJourneySource[];
  readonly bindings: readonly { readonly name: string; readonly source_position: number; readonly query: string }[];
  readonly binding_checks: readonly { readonly binding: string; readonly position: number; readonly query: string }[];
  readonly steps: readonly { readonly position: number; readonly inferred_connection: string | null }[];
}

export interface Run {
  readonly journey?: RunJourney;
  readonly id: string;
  readonly status: RunStatus;
  readonly testId: string;
  readonly resolvedAt: string;
  readonly cancellationRequestedAt: string | null;
  readonly outcomeSummary: string | null;
}

export interface RunEvent {
  readonly eventId: string;
  readonly runId: string;
  readonly attempt: number | null;
  readonly sequence: number;
  readonly elapsedMs: number;
  readonly replayOffsetMs: number | null;
  readonly kind: string;
  readonly type: string;
  readonly phase: "STARTED" | "COMPLETED" | null;
  readonly state: string | null;
  readonly outcome: RunOutcome | null;
  readonly correlation: {
    readonly stepId: string | null;
    readonly actionId: string | null;
    readonly assertionId: string | null;
  };
  readonly safePayload: Readonly<Record<string, unknown>>;
}

export type EvidenceType = "state_trace" | "console" | "network" | "command_journal" | "screenshot" | "replay" | "manifest";

export interface EvidenceArtifact {
  readonly evidenceId: string;
  readonly runId: string;
  readonly attempt: number;
  readonly replayPart: number | null;
  readonly type: EvidenceType;
  readonly mediaType: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly capturedAt: string;
}

export interface RunScreenshot {
  readonly evidence: EvidenceArtifact;
  readonly bytes: Uint8Array;
}

export interface ReplayVideo {
  readonly bytes: Uint8Array;
  readonly mediaType: "video/mp4" | "video/webm";
  readonly sha256: string;
}

export interface BrowserDebuggerRecord {
  readonly requestId?: string;
  readonly sequence: number;
  readonly observedAt: string;
  readonly monotonicMs: number;
  readonly kind: string;
  readonly pageId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface BrowserMetrics {
  readonly creditsUsed: number | null;
  readonly browserTimeCreditsUsed: number | null;
  readonly proxyDataCreditsUsed: number | null;
}

export interface LiveViewCapability {
  readonly url: string;
  readonly expiresAt: string;
  readonly viewport: { readonly width: number; readonly height: number };
}

export interface RunFeedback {
  readonly runId: string;
  readonly useful: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RunActivitySnapshot {
  readonly runId: string;
  readonly revision: number;
  readonly console: readonly BrowserDebuggerRecord[];
  readonly network: readonly BrowserDebuggerRecord[];
  readonly metrics: BrowserMetrics;
}

/** Evidence the page reads. The open package does not call the hosted API. */
export interface RunClient {
  loadScreenshots(runId: string, evidenceIds: readonly string[]): Promise<readonly RunScreenshot[]>;
  loadReplayVideo(runId: string): Promise<ReplayVideo>;
  getLiveView(runId: string): Promise<LiveViewCapability>;
  loadDebugger(runId: string, type: "console" | "network"): Promise<readonly BrowserDebuggerRecord[]>;
  readActivity?(runId: string): Promise<RunActivitySnapshot>;
  loadMetrics(runId: string): Promise<BrowserMetrics>;
  getFeedback(runId: string): Promise<RunFeedback | null>;
  setFeedback(runId: string, useful: boolean): Promise<RunFeedback>;
}

export interface RunTestStep {
  readonly id: string;
  readonly position: number;
  readonly type: string;
  readonly instruction: string;
  readonly enabled: boolean;
  /** Host note for this step, such as "replayed · 0 model calls". */
  readonly note?: string | null;
}

export interface RunTest {
  readonly name: string;
  readonly enabled: boolean;
  readonly steps: readonly RunTestStep[];
}

export interface RunPageState {
  readonly kind: "loading" | "error" | "ready";
  readonly forbidden: boolean;
  readonly message: string;
  readonly connection: RunConnection;
  readonly warning: string | null;
  readonly run: Run | null;
  readonly events: readonly RunEvent[];
}

/** A diagnostic tab. Omit one to hide that panel. Labels are the host's words. */
export interface EvidencePanel {
  readonly id: "console" | "network" | "screengraph" | "metrics";
  readonly label: string;
}

/** One row in the metrics panel. The host supplies the label and the value. */
export interface RunMetric {
  readonly label: string;
  readonly value: string;
}
