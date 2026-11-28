import { FRESH_AUTH_ISSUE_SQL, FRESH_AUTH_TAKE_SQL } from "./deletion-fresh-auth-sql.server";
import { createHmac, randomBytes } from "node:crypto";
import type { FreshAuthFlowStore } from "./deletion-fresh-auth-consume.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const secret = /^[0-9a-f]{64}$/;

// Internal only. Supply an independent fresh-auth database capability and HMAC key.
// Browser binding must be a trusted, server-issued random secret, not browser input.
export function createPostgresFreshAuthStore(
  db: DeletionSqlExecutor,
  key: string,
): FreshAuthFlowStore & {
  issue(input: { userId: string; sessionId: string; browserBinding: string }): Promise<string>;
} {
  if (!secret.test(key)) throw new Error("Invalid fresh-auth storage key.");
  const hash = (domain: string, value: string) =>
    createHmac("sha256", Buffer.from(key, "hex"))
      .update(domain + ":" + value)
      .digest("hex");

  return {
    async issue({ userId, sessionId, browserBinding }) {
      if (!uuid.test(userId) || !uuid.test(sessionId) || !secret.test(browserBinding)) {
        throw new Error("Invalid fresh-auth issuance input.");
      }
      const flowId = randomBytes(32).toString("hex");
      const result = await db.query<{ issued: boolean }>(FRESH_AUTH_ISSUE_SQL, [
        hash("fresh-auth-flow", flowId),
        hash("fresh-auth-browser", browserBinding),
        userId,
        sessionId,
      ]);
      if (result.rows.length !== 1 || result.rows[0]?.issued !== true) {
        throw new Error("Fresh-auth issuance failed.");
      }
      return flowId;
    },
    async take(flowId, browserBinding) {
      if (!secret.test(flowId) || !secret.test(browserBinding)) return null;
      const result = await db.query<{
        user_id: string;
        original_session_id: string;
        started_ms: string;
        expires_ms: string;
      }>(FRESH_AUTH_TAKE_SQL, [
        hash("fresh-auth-flow", flowId),
        hash("fresh-auth-browser", browserBinding),
      ]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      if (
        result.rows.length !== 1 ||
        !row ||
        typeof row.user_id !== "string" ||
        !uuid.test(row.user_id) ||
        typeof row.original_session_id !== "string" ||
        !uuid.test(row.original_session_id) ||
        typeof row.started_ms !== "string" ||
        !/^\d+$/.test(row.started_ms) ||
        typeof row.expires_ms !== "string" ||
        !/^\d+$/.test(row.expires_ms)
      ) {
        throw new Error("Invalid fresh-auth storage response.");
      }
      const startedAt = Number(row.started_ms);
      const expiresAt = Number(row.expires_ms);
      if (
        !Number.isSafeInteger(startedAt) ||
        !Number.isSafeInteger(expiresAt) ||
        expiresAt <= startedAt ||
        expiresAt - startedAt > 600000
      ) {
        throw new Error("Invalid fresh-auth storage lifetime.");
      }
      return {
        userId: row.user_id,
        originalSessionId: row.original_session_id,
        browserBinding,
        startedAt,
        expiresAt,
      };
    },
  };
}
