import { describe, expect, it } from "vitest";
import { GET } from "../../src/app/api/health/route";
import { validRoute } from "../../scripts/pr-route.mjs";

describe("public liveness endpoint", () => {
  it("returns no-store process health without integration or secret claims", async () => {
    const result = GET();
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
    expect(await result.json()).toEqual({ status: "ok", service: "home-notification-hub", stage: "foundation" });
  });
});
describe("release routing", () => {
  it.each(["feat/auth", "fix/retry", "docs/setup", "chore/deps"])("accepts %s into staging", head => {
    expect(validRoute("staging", head, true)).toBe(true);
  });
  it("permits only same-repository staging promotion", () => {
    expect(validRoute("main", "staging", true)).toBe(true);
    expect(validRoute("main", "staging", false)).toBe(false);
  });
  it.each([["main", "feat/auth"], ["main", "main"], ["staging", "main"], ["staging", "staging"], ["staging", "random"], ["staging", "feat/"], ["other", "feat/auth"]])("rejects %s from %s", (base, head) => {
    expect(validRoute(base, head, true)).toBe(false);
  });
  it("allows task forks only into staging", () => {
    expect(validRoute("staging", "feat/example", false)).toBe(true);
    expect(validRoute("main", "feat/example", false)).toBe(false);
  });
});
