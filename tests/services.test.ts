import { describe, expect, it } from "vitest";
import { prettifyServiceName, serviceDescription } from "../src/services";

describe("advisory service display", () => {
  it("prettifies camelCase names and passes spaced names through", () => {
    expect(prettifyServiceName("AcademicAdvising")).toBe("Academic Advising");
    expect(prettifyServiceName("Career  Services")).toBe("Career Services");
  });
  it("finds a blurb by raw or prettified name, and none for an unknown service", () => {
    expect(serviceDescription("AcademicAdvising")).toMatch(/degree progress/);
    expect(serviceDescription("Career Services")).toMatch(/Resumes/);
    expect(serviceDescription("Chess Club")).toBe("");
  });
});
