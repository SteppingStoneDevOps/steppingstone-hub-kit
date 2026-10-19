// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { controlBorder, fieldBase } from "../src/form";
import { SupportLine } from "../src/SupportLine";

afterEach(cleanup);

/*
 * WCAG 1.4.11 Non-text Contrast (v0.22.0). The kit owns no colours: each hub defines the tokens
 * in its globals.css. These are the advisor-, admin- and talent-hub values as of 2026-10-19
 * (identical across the three for every token used here). If a hub changes one of them, update
 * it here and the test says whether the field edge still reaches 3:1.
 */
const TOKENS = {
  dark: { muted: "#90a4be", border: "#21344e", bg: "#0a1220", panel: "#0f1a2b", panel2: "#13223a" },
  light: { muted: "#5b6b82", border: "#dbe3ee", bg: "#eef2f8", panel: "#ffffff", panel2: "#f3f6fb" },
};

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, p: number): RGB => a.map((v, i) => v * p + b[i] * (1 - p)) as RGB;
const lum = (c: RGB) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The muted share `controlBorder` mixes into --color-border for each theme. */
function shares() {
  const dark = controlBorder.match(/^border-\[color-mix\(in_srgb,var\(--color-muted\)_(\d+)%,var\(--color-border\)\)\]/);
  const light = controlBorder.match(
    /\[:where\(\[data-theme=light\]\)_&\]:border-\[color-mix\(in_srgb,var\(--color-muted\)_(\d+)%,var\(--color-border\)\)\]/,
  );
  expect(dark).not.toBeNull();
  expect(light).not.toBeNull();
  return { dark: Number(dark![1]) / 100, light: Number(light![1]) / 100 };
}

describe("form control edges (1.4.11)", () => {
  it("fieldBase uses the control border, not the card hairline", () => {
    expect(fieldBase).toContain(controlBorder);
    expect(fieldBase).not.toMatch(/\bborder-border\b/);
  });

  for (const theme of ["dark", "light"] as const) {
    it(`reaches 3:1 against the surface and the field's own fill (${theme})`, () => {
      const t = TOKENS[theme];
      const edge = mix(rgb(t.muted), rgb(t.border), shares()[theme]);
      for (const surface of [t.bg, t.panel, t.panel2]) {
        const s = rgb(surface);
        const fill = mix(rgb(t.bg), s, 0.6); // fieldBase: bg-bg/60 over the surface
        expect(ratio(edge, s)).toBeGreaterThanOrEqual(3);
        expect(ratio(edge, fill)).toBeGreaterThanOrEqual(3);
      }
      // The old hairline did not, which is why fields no longer use it.
      expect(ratio(rgb(t.border), rgb(t.bg))).toBeLessThan(3);
    });
  }
});

describe("in-text links (1.4.1)", () => {
  it("SupportLine's email link is underlined, not told apart by colour alone", () => {
    render(<SupportLine hub="Advisor Hub" />);
    expect(screen.getByRole("link").className).toMatch(/(^|\s)underline(\s|$)/);
  });
});
