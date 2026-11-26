import { describe, expect, test } from "bun:test";
import { createSessionAuthorizationStorage } from "./deletion-session-storage.server";

const authorization = {
  authorizationId: "33333333-3333-4333-8333-333333333333",
  authorizationSecret: "a".repeat(64),
};

function setup() {
  const entries = new Map();
  let time = 1000;
  const storage = {
    async put(key, value, ttlMs) {
      entries.set(key, { value, ttlMs });
    },
    async take(key) {
      const entry = entries.get(key);
      entries.delete(key);
      return entry?.value ?? null;
    },
  };
  const session = (sessionToken = "session-a", key = Buffer.alloc(32, 7)) =>
    createSessionAuthorizationStorage({ storage, key, sessionToken, now: () => time });
  return { entries, session, advance: (ms) => (time += ms) };
}

describe("encrypted deletion authorization storage", () => {
  test("encrypts credentials and permits only one retrieval", async () => {
    const { entries, session } = setup();
    await session().save(authorization);
    const [slot, entry] = [...entries.entries()][0];
    expect(slot).not.toContain("session-a");
    expect(entry.value).not.toContain(authorization.authorizationSecret);
    expect(entry.ttlMs).toBe(240000);
    expect(await session().take()).toEqual(authorization);
    expect(await session().take()).toBeNull();
  });

  test("different sessions and keys cannot retrieve credentials", async () => {
    const { session } = setup();
    await session().save(authorization);
    expect(await session("session-b").take()).toBeNull();
    expect(await session("session-a", Buffer.alloc(32, 8)).take()).toBeNull();
    expect(await session().take()).toEqual(authorization);
  });

  test("rejects expired credentials even if the provider retains them", async () => {
    const { session, advance } = setup();
    await session().save(authorization);
    advance(240000);
    expect(await session().take()).toBeNull();
  });

  test("rejects tampered ciphertext", async () => {
    const { entries, session } = setup();
    await session().save(authorization);
    const [slot, entry] = [...entries.entries()][0];
    const bytes = Buffer.from(entry.value, "base64");
    bytes[28] ^= 1;
    entries.set(slot, { ...entry, value: bytes.toString("base64") });
    expect(await session().take()).toBeNull();
  });

  test("rejects invalid storage configuration", () => {
    const { session } = setup();
    expect(() => session("")).toThrow("not configured");
    expect(() => session("session-a", Buffer.alloc(16))).toThrow("not configured");
  });

  test("concurrent retrieval returns credentials at most once", async () => {
    const { session } = setup();
    await session().save(authorization);
    const results = await Promise.all([session().take(), session().take()]);
    expect(results.filter(Boolean)).toEqual([authorization]);
  });
});
