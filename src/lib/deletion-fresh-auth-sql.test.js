import { describe, expect, test } from "bun:test";
import {
  assertFreshAuthSqlAllowed,
  FRESH_AUTH_IDENTITY_SQL,
  FRESH_AUTH_ISSUE_SQL,
  FRESH_AUTH_TAKE_SQL,
} from "./deletion-fresh-auth-sql.server";

describe("fresh-auth SQL allowlist", () => {
  const allowed = [
    [FRESH_AUTH_IDENTITY_SQL, 0],
    [FRESH_AUTH_ISSUE_SQL, 4],
    [FRESH_AUTH_TAKE_SQL, 2],
  ];

  test("accepts only the exact supported statements with their arity", () => {
    for (const [statement, count] of allowed) {
      expect(() => assertFreshAuthSqlAllowed(statement, count)).not.toThrow();
      for (const wrong of [-1, 0, 1, 2, 3, 4, 5]) {
        if (wrong !== count) {
          expect(() => assertFreshAuthSqlAllowed(statement, wrong)).toThrow(
            "Unsupported fresh-auth SQL statement.",
          );
        }
      }
    }
  });

  test("rejects modified statements and appended SQL", () => {
    for (const [statement, count] of allowed) {
      for (const altered of [
        " " + statement,
        statement + ";",
        statement + " -- comment",
        statement + "; select 1",
        statement.toUpperCase(),
      ]) {
        expect(() => assertFreshAuthSqlAllowed(altered, count)).toThrow(
          "Unsupported fresh-auth SQL statement.",
        );
      }
    }
  });

  test("rejects unrelated SQL, cleanup, role changes and direct table access", () => {
    for (const statement of [
      "",
      "select 1",
      "select * from auth.users",
      "select * from private.deletion_fresh_auth_flows",
      "delete from private.deletion_fresh_auth_flows",
      "select private.cleanup_deletion_fresh_auth_flows()",
      "set role postgres",
    ]) {
      for (const count of [0, 2, 4]) {
        expect(() => assertFreshAuthSqlAllowed(statement, count)).toThrow(
          "Unsupported fresh-auth SQL statement.",
        );
      }
    }
  });
});
