import { expect, test } from "bun:test";
import { readSessionPolicyConfig } from "./deletion-fresh-auth-session-config.server";

const config = {
  maximumLifetime: { enabled: true, milliseconds: 60000 },
  inactivityTimeout: { enabled: false },
  singleSessionEnabled: false,
};

test("explicit provider limits normalize without implicit defaults", () => {
  expect(readSessionPolicyConfig(config)).toEqual({
    maximumLifetimeMs: 60000,
    inactivityTimeoutMs: null,
    singleSessionPolicySatisfied: true,
  });
});

test("unknown or unsupported provider settings reject", () => {
  for (const override of [
    { maximumLifetime: undefined },
    { maximumLifetime: { enabled: true, milliseconds: 0 } },
    { maximumLifetime: { enabled: true, milliseconds: Infinity } },
    { inactivityTimeout: { enabled: false, milliseconds: 1000 } },
    { inactivityTimeout: null },
    { singleSessionEnabled: true },
    { singleSessionEnabled: undefined },
  ]) {
    expect(readSessionPolicyConfig({ ...config, ...override })).toBeNull();
  }
});
