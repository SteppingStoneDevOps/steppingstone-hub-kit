// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Field, Input, RequiredNote, Select } from "../src/form";

afterEach(cleanup);

/*
 * Field wires its label, hint and error to the control (HECVAT accessibility, 2026-10-16). A caller
 * that passes its own id keeps it; children that are not a single element render unchanged.
 */
describe("Field", () => {
  it("links the label to the control with a generated id", () => {
    render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.id).not.toBe("");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(input.getAttribute("aria-required")).toBeNull();
  });

  it("keeps an explicit id on the control", () => {
    render(
      <Field label="Role">
        <Select id="role-select">
          <option>Advisor</option>
        </Select>
      </Field>,
    );
    expect(screen.getByLabelText("Role").id).toBe("role-select");
  });

  it("describes the control by its hint, and by its error with aria-invalid", () => {
    render(
      <Field label="Phone" hint="Digits only" error="Required">
        <input />
      </Field>,
    );
    const input = screen.getByLabelText("Phone");
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0])!.textContent).toBe("Digits only");
    expect(document.getElementById(ids[1])!.textContent).toBe("Required");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Required");
  });

  it("leaves multiple children alone", () => {
    render(
      <Field label="Range">
        <input aria-label="From" />
        <input aria-label="To" />
      </Field>,
    );
    expect(screen.getByLabelText("From").id).toBe("");
    expect(screen.getByText("Range").getAttribute("for")).toBeNull();
  });

  // Required marking (WCAG 3.3.2, HECVAT 2026-10-18): an asterisk the accessibility tree does not
  // see, and aria-required (never the native attribute) on the wired control.
  it("marks a required control with a hidden asterisk and aria-required", () => {
    render(
      <Field label="Email" required>
        <Input />
      </Field>,
    );
    // The accessible name is still "Email": the asterisk is aria-hidden.
    const input = screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement;
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.required).toBe(false);
    const star = screen.getByText("*");
    expect(star.getAttribute("aria-hidden")).toBe("true");
    expect(star.closest("label")).toBe(input.labels![0]);
  });

  it("lets the child's own aria-required win", () => {
    render(
      <Field label="Email" required>
        <Input aria-required={false} />
      </Field>,
    );
    expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-required")).toBe("false");
  });

  it("gives unwired children the label marker only", () => {
    render(
      <Field label="Range" required>
        <input aria-label="From" />
        <input aria-label="To" />
      </Field>,
    );
    expect(screen.getByText("*").closest("label")!.textContent).toBe("Range*");
    expect(screen.getByLabelText("From").getAttribute("aria-required")).toBeNull();
    expect(screen.getByLabelText("To").getAttribute("aria-required")).toBeNull();
  });
});

describe("RequiredNote", () => {
  it("says Required, with the asterisk hidden from the accessibility tree", () => {
    render(<RequiredNote className="mt-2" />);
    const note = screen.getByText(/Required/);
    expect(note.tagName).toBe("P");
    expect(note.textContent).toBe("* Required");
    expect(note.className).toContain("mt-2");
    const star = note.querySelector("[aria-hidden='true']");
    expect(star?.textContent).toBe("*");
  });
});
