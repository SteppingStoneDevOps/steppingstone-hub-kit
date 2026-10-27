// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import * as kit from "../src";
import { THEME_KEY, noFlashThemeScript } from "../src/theme";
import { EmptyState } from "../src/EmptyState";

afterEach(cleanup);

/*
 * v0.23.0: a hub's server layout imported THEME_KEY from the "use client" ThemeProvider, got a
 * client reference instead of the string, and its no-flash script shipped Next's "Attempted to
 * call THEME_KEY() from the server" text (a SyntaxError), so a saved light theme flashed dark.
 * The constants now live in a module with no client directive.
 */
describe("theme module", () => {
  it("has no client directive, so a server component gets real values", () => {
    const src = readFileSync(resolve(process.cwd(), "src/theme.ts"), "utf8");
    expect(src).not.toMatch(/^\s*["']use client["']/m);
  });

  it("builds the no-flash script around the literal key", () => {
    expect(THEME_KEY).toBe("th-theme");
    expect(noFlashThemeScript).toContain("localStorage.getItem('th-theme')");
    expect(noFlashThemeScript).not.toContain("THEME_KEY");
    expect(() => new Function(noFlashThemeScript)).not.toThrow();
  });

  it("applies a saved light theme and defaults to dark", () => {
    localStorage.setItem(THEME_KEY, "light");
    new Function(noFlashThemeScript)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    localStorage.removeItem(THEME_KEY);
    new Function(noFlashThemeScript)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("keeps THEME_KEY, noFlashThemeScript and ThemeProvider on the package root", () => {
    expect(kit.THEME_KEY).toBe("th-theme");
    expect(kit.noFlashThemeScript).toBe(noFlashThemeScript);
    expect(typeof kit.ThemeProvider).toBe("function");
  });
});

describe("EmptyState headingLevel", () => {
  it("defaults to h3", () => {
    render(<EmptyState icon={Inbox} title="Nothing yet" />);
    expect(screen.getByRole("heading", { level: 3, name: "Nothing yet" })).toBeTruthy();
  });

  it("renders the level it is given", () => {
    render(<EmptyState icon={Inbox} title="No students" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "No students" })).toBeTruthy();
  });
});
