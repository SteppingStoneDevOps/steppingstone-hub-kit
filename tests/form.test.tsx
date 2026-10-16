// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Field, Input, Select } from "../src/form";

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
});
