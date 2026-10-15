import assert from "node:assert/strict";
import test from "node:test";
import { CHOICE_KEY, INSTALL_KEY, recordAdoption, setTelemetry, type AdoptionStorage } from "./adoption.ts";

function memory(): AdoptionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

test("a start is counted once per install", async () => {
  const storage = memory();
  const bodies: string[] = [];
  const fetch = async (_url: string | URL | Request, init?: RequestInit) => {
    bodies.push(String(init?.body));
    return new Response(null, { status: 204 });
  };
  assert.equal(await recordAdoption({ version: "0.0.1", storage, fetch, randomId: () => "install-1" }), true);
  assert.equal(await recordAdoption({ version: "0.0.1", storage, fetch, randomId: () => "other" }), true);
  assert.deepEqual(JSON.parse(bodies[0]), {
    event: "ui_started",
    version: "0.0.1",
    install_id: "install-1",
    surface: "web",
  });
  assert.equal(JSON.parse(bodies[1]).install_id, "install-1");
});

test("Do Not Track and an explicit opt-out send nothing", async () => {
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    return new Response(null, { status: 204 });
  };
  const quiet = memory();
  assert.equal(await recordAdoption({ version: "0.0.1", storage: quiet, fetch, doNotTrack: true }), false);
  assert.equal(quiet.getItem(INSTALL_KEY), null);

  const optedOut = memory();
  setTelemetry(optedOut, "off");
  assert.equal(await recordAdoption({ version: "0.0.1", storage: optedOut, fetch }), false);
  assert.equal(optedOut.getItem(CHOICE_KEY), "off");
  assert.equal(calls, 0);
});

test("a failed collector does not throw", async () => {
  const fetch = async () => { throw new Error("offline"); };
  assert.equal(await recordAdoption({ version: "0.0.1", storage: memory(), fetch, randomId: () => "install-2" }), false);
});
