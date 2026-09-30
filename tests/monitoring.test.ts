import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canaryPage,
  describeThrown,
  laneFromOrigin,
  reportClientError,
  resetClientErrorDedupe,
} from "../src/monitoring";

afterEach(() => {
  vi.unstubAllGlobals();
  resetClientErrorDedupe();
});

describe("canaryPage — the marker Lynn's browser canary asserts", () => {
  it("renders OK with the build and a 200 when every check passed", async () => {
    const res = canaryPage({ hub: "Talent Hub", build: "abc1234", checks: [{ name: "config", ok: true }] });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('data-canary="ok"');
    expect(html).toContain('data-build="abc1234"');
    expect(html).toContain("OK Talent Hub abc1234");
  });
  it("renders FAIL with the reasons and a 503 when any check failed", async () => {
    const res = canaryPage({
      hub: "Admin Hub",
      build: "",
      checks: [{ name: "config", ok: true }, { name: "gateway", ok: false, detail: "503 from /health" }],
    });
    expect(res.status).toBe(503);
    const html = await res.text();
    expect(html).toContain('data-canary="fail"');
    expect(html).toContain("FAIL Admin Hub unknown");
    expect(html).toContain("gateway: 503 from /health");
  });
});

describe("laneFromOrigin", () => {
  it("reads the lane off the public origin", () => {
    expect(laneFromOrigin("https://talent.dev.mysteppingstone.ai")).toBe("dev");
    expect(laneFromOrigin("https://advisor.qa.mysteppingstone.ai")).toBe("qa");
    expect(laneFromOrigin("https://advisor.mysteppingstone.ai")).toBe("prod");
    expect(laneFromOrigin("http://localhost:3000")).toBe("local");
    expect(laneFromOrigin(undefined)).toBe("local");
  });
});

describe("reportClientError", () => {
  it("POSTs the report to the hub's own route and dedupes the same error within a minute", () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = { source: "boundary" as const, route: "/employer/positions", message: "boom", digest: "d1" };
    reportClientError(r);
    reportClientError(r);
    reportClientError({ ...r, message: "different" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/client-error");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(String(init.body))).toEqual(r);
  });
  it("never throws, even when fetch does", () => {
    vi.stubGlobal("fetch", () => { throw new Error("no network"); });
    expect(() => reportClientError({ source: "window", route: "/", message: "x" })).not.toThrow();
  });
});

describe("describeThrown", () => {
  it("handles Errors, strings and objects", () => {
    expect(describeThrown(new TypeError("bad")).message).toBe("bad");
    expect(describeThrown("plain").message).toBe("plain");
    expect(describeThrown({ a: 1 }).message).toBe('{"a":1}');
  });
});
