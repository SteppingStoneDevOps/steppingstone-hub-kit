// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PhoneInput } from "../src/PhoneInput";

afterEach(cleanup);

/*
 * Autofill tokens (WCAG 1.3.5) identify a field as the signed-in user's own data. Most hub phone
 * fields hold someone else's number (a school's, an advisor being edited), so the token is opt-in
 * (HECVAT 2026-10-18): the default emits no attribute at all, not autocomplete="off", which is
 * itself a hint.
 */
describe("PhoneInput autocomplete", () => {
  it("sets no autocomplete attribute by default", () => {
    render(<PhoneInput aria-label="School phone" />);
    expect(screen.getByLabelText("School phone").hasAttribute("autocomplete")).toBe(false);
  });

  it("passes autoComplete through for the user's own number", () => {
    render(<PhoneInput aria-label="Your phone" autoComplete="tel" />);
    expect(screen.getByLabelText("Your phone").getAttribute("autocomplete")).toBe("tel");
  });
});
