// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoHint } from "../src/InfoHint";
import { Modal } from "../src/Modal";
import { ArchetypeChip } from "../src/crs/ArchetypeChip";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/*
 * WCAG 1.4.13 Content on Hover or Focus (v0.22.0). InfoHint and ArchetypeChip share
 * useHoverHint: the content is dismissible (Escape, without moving hover or focus), hoverable
 * (the pointer can move onto it) and persistent (no timeout). The bubble is hidden with
 * `invisible` on its positioning wrapper, which jsdom cannot compute, so the tests read the class.
 */
const shown = (tip: HTMLElement) => tip.parentElement!.classList.contains("visible");

describe("InfoHint", () => {
  it("is hidden until hovered and describes its trigger", () => {
    render(<InfoHint label="About members">Everyone with a seat.</InfoHint>);
    const trigger = screen.getByRole("button", { name: "About members" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);
    expect(shown(tip)).toBe(false);
  });

  it("stays open while the pointer moves from the icon onto the bubble (hoverable)", async () => {
    const user = userEvent.setup();
    render(<InfoHint>Everyone with a seat.</InfoHint>);
    const trigger = screen.getByRole("button", { name: "More information" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    await user.hover(trigger);
    expect(shown(tip)).toBe(true);
    await user.hover(tip);
    expect(shown(tip)).toBe(true);
    expect(tip.className).not.toContain("pointer-events-none");
    expect(tip.parentElement!.className).not.toContain("pointer-events-none");
    await user.unhover(tip);
    expect(shown(tip)).toBe(false);
  });

  it("Escape hides a hovered bubble without the pointer moving, and a fresh hover shows it again", async () => {
    const user = userEvent.setup();
    render(<InfoHint>Everyone with a seat.</InfoHint>);
    const trigger = screen.getByRole("button", { name: "More information" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    await user.hover(trigger);
    await user.keyboard("{Escape}");
    expect(shown(tip)).toBe(false);
    await user.unhover(trigger);
    await user.hover(trigger);
    expect(shown(tip)).toBe(true);
  });

  it("opens on keyboard focus; Escape hides it and focus stays on the icon", async () => {
    const user = userEvent.setup();
    render(<InfoHint>Everyone with a seat.</InfoHint>);
    const trigger = screen.getByRole("button", { name: "More information" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    await user.tab();
    expect(document.activeElement).toBe(trigger);
    expect(shown(tip)).toBe(true);
    await user.keyboard("{Escape}");
    expect(shown(tip)).toBe(false);
    expect(document.activeElement).toBe(trigger);
    // Activating the icon after a dismissal brings the bubble back.
    await user.keyboard("{Enter}");
    expect(shown(tip)).toBe(true);
    await user.tab();
    expect(shown(tip)).toBe(false);
  });

  it("stays open with no timeout while hovered (persistent)", () => {
    vi.useFakeTimers();
    render(<InfoHint>Everyone with a seat.</InfoHint>);
    const trigger = screen.getByRole("button", { name: "More information" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(shown(tip)).toBe(true);
  });

  it("the first Escape closes the hint, not the dialog it sits in", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Settings">
        <InfoHint>Everyone with a seat.</InfoHint>
      </Modal>,
    );
    const trigger = screen.getByRole("button", { name: "More information" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    await user.hover(trigger);
    expect(shown(tip)).toBe(true);
    await user.keyboard("{Escape}");
    expect(shown(tip)).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ArchetypeChip", () => {
  it("is reachable by keyboard and its tooltip opens on focus (it was hover-only)", async () => {
    const user = userEvent.setup();
    render(<ArchetypeChip archetype="Ascending" />);
    const chip = screen.getByRole("button", { name: "Ascending" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    expect(chip.getAttribute("aria-describedby")).toBe(tip.id);
    expect(shown(tip)).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(chip);
    expect(shown(tip)).toBe(true);
    await user.keyboard("{Escape}");
    expect(shown(tip)).toBe(false);
    expect(document.activeElement).toBe(chip);
  });

  it("is hoverable and dismissible with the pointer still over it", async () => {
    const user = userEvent.setup();
    render(<ArchetypeChip archetype="Ascending" />);
    const chip = screen.getByRole("button", { name: "Ascending" });
    const tip = screen.getByRole("tooltip", { hidden: true });
    await user.hover(chip);
    await user.hover(tip);
    expect(shown(tip)).toBe(true);
    await user.keyboard("{Escape}");
    expect(shown(tip)).toBe(false);
  });

  it("Enter on the chip does not trigger a clickable row around it", async () => {
    const user = userEvent.setup();
    const onRow = vi.fn();
    render(
      <table>
        <tbody>
          <tr onClick={onRow}>
            <td>
              <ArchetypeChip archetype="Ascending" />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onRow).not.toHaveBeenCalled();
  });
});
