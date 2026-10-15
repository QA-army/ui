/** Anonymous adoption count for the open UI. No Workspace, Test, URL, or account data. */

export const ADOPTION_ENDPOINT = "https://qa.army/api/ui-adoption";
export const INSTALL_KEY = "qa-army-ui-install";
export const CHOICE_KEY = "qa-army-ui-telemetry";

export type AdoptionStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type AdoptionRecord = {
  event: "ui_started";
  version: string;
  install_id: string;
  surface: "web";
};

export function telemetryEnabled(storage: AdoptionStorage, doNotTrack = false): boolean {
  if (doNotTrack) return false;
  return storage.getItem(CHOICE_KEY) !== "off";
}

export function setTelemetry(storage: AdoptionStorage, choice: "on" | "off"): void {
  if (choice === "off") {
    storage.setItem(CHOICE_KEY, "off");
    storage.removeItem(INSTALL_KEY);
    return;
  }
  storage.removeItem(CHOICE_KEY);
}

export async function recordAdoption(input: {
  version: string;
  storage: AdoptionStorage;
  endpoint?: string;
  fetch?: typeof fetch;
  doNotTrack?: boolean;
  randomId?: () => string;
}): Promise<boolean> {
  if (!telemetryEnabled(input.storage, input.doNotTrack)) return false;
  let installId = input.storage.getItem(INSTALL_KEY);
  if (!installId) {
    installId = input.randomId ? input.randomId() : crypto.randomUUID();
    input.storage.setItem(INSTALL_KEY, installId);
  }
  const record: AdoptionRecord = {
    event: "ui_started",
    version: input.version,
    install_id: installId,
    surface: "web",
  };
  try {
    const response = await (input.fetch ?? fetch)(input.endpoint ?? ADOPTION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}
