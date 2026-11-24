import { describe, expect, test } from "bun:test";
import { requestDeletionEmailChallenge } from "./deletion-request.server";

const userId = "11111111-1111-4111-8111-111111111111";
const emailConfig = { apiKey: "re_test", from: "Cosmic Dossier <security@example.com>" };
const secret = Buffer.alloc(32, 4);

function fixture() {
  const records = [];
  const revoked = [];
  return {
    records,
    revoked,
    store: {
      async create(record) {
        records.push(record);
      },
      async revoke(id, owner) {
        revoked.push({ id, owner });
      },
    },
  };
}

describe("deletion email request orchestration", () => {
  test("stores a keyed hash before sending and never returns the code", async () => {
    const state = fixture();
    let sentCode = "";
    const result = await requestDeletionEmailChallenge({
      store: state.store,
      emailConfig,
      secret,
      userId,
      verifiedEmail: "owner@example.com",
      now: new Date("2026-11-24T12:00:00Z"),
      sender: async (_config, recipient, code) => {
        expect(state.records).toHaveLength(1);
        expect(recipient).toBe("owner@example.com");
        sentCode = code;
        return { sent: true };
      },
    });
    expect(sentCode).toMatch(/^\d{8}$/);
    expect(state.records[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(state.records[0].tokenHash).not.toBe(sentCode);
    expect(result.challengeId).toBe(state.records[0].id);
    expect(result.expiresAt).toBe("2026-11-24T12:10:00.000Z");
    expect(JSON.stringify(result)).not.toContain(sentCode);
    expect(state.revoked).toHaveLength(0);
  });

  test("revokes a persisted challenge when delivery fails", async () => {
    const state = fixture();
    await expect(
      requestDeletionEmailChallenge({
        store: state.store,
        emailConfig,
        secret,
        userId,
        verifiedEmail: "owner@example.com",
        sender: async () => {
          throw new Error("Provider unavailable");
        },
      }),
    ).rejects.toThrow("Could not send deletion verification");
    expect(state.revoked).toEqual([{ id: state.records[0].id, owner: userId }]);
  });

  test("does not deliver when storage rejects the request", async () => {
    let delivered = false;
    await expect(
      requestDeletionEmailChallenge({
        store: {
          async create() {
            throw new Error("Rate limit reached");
          },
          async revoke() {},
        },
        emailConfig,
        secret,
        userId,
        verifiedEmail: "owner@example.com",
        sender: async () => {
          delivered = true;
          return { sent: true };
        },
      }),
    ).rejects.toThrow("Rate limit reached");
    expect(delivered).toBe(false);
  });
});
