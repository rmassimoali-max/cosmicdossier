import { expect, test } from "bun:test";
import {
  clearFreshAuthBrowserBinding,
  createFreshAuthBrowserBinding,
  readFreshAuthBrowserBinding,
} from "./deletion-fresh-auth-browser.server";

test("binding is random and cookie is restricted to HTTPS and same-site requests", () => {
  const first = createFreshAuthBrowserBinding();
  const second = createFreshAuthBrowserBinding();
  expect(first.browserBinding).toMatch(/^[0-9a-f]{64}$/);
  expect(first.browserBinding).not.toBe(second.browserBinding);
  expect(first.setCookie).toBe(
    "__Host-deletion-fresh-auth=" +
      first.browserBinding +
      "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=600",
  );
  expect(readFreshAuthBrowserBinding(first.setCookie.split(";")[0])).toBe(first.browserBinding);
});

test("missing, malformed and duplicate bindings are rejected", () => {
  const cookie = "__Host-deletion-fresh-auth=" + "a".repeat(64);
  for (const header of [
    "",
    "other=abc",
    "__Host-deletion-fresh-auth=abc",
    cookie + "; " + cookie,
  ]) {
    expect(readFreshAuthBrowserBinding(header)).toBeNull();
  }
  expect(readFreshAuthBrowserBinding("other=abc; " + cookie)).toBe("a".repeat(64));
});

test("clearing the binding expires the same protected cookie", () => {
  expect(clearFreshAuthBrowserBinding()).toBe(
    "__Host-deletion-fresh-auth=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0",
  );
});
