// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { useRef, useState } from "react";
import { Modal, useFocusTrap } from "../src/Modal";
import { Input } from "../src/form";

afterEach(cleanup);

/*
 * A write modal passes `dismissable={!pending}` so it cannot be closed while its save is in flight —
 * a dismissed modal unmounts and loses the failure it was about to show (audit F-A14, hub-kit v0.14.0).
 */
describe("Modal dismissable", () => {
  function mount(dismissable: boolean) {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Save thing" dismissable={dismissable}>
        <p>body</p>
      </Modal>,
    );
    return onClose;
  }

  it("when dismissable, Escape, the X and a backdrop click all close it", () => {
    const onClose = mount(true);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByLabelText("Close"));
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("when not dismissable, none of them do, and the X is disabled", () => {
    const onClose = mount(false);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByLabelText("Close"));
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Close") as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders nothing when closed", () => {
    render(<Modal open={false} onClose={() => {}} title="x"><p>hidden</p></Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

/*
 * Focus management (HECVAT accessibility, 2026-10-16): focus enters the panel on open, Tab cycles
 * inside it, and focus goes back to the opener on close. The title is the dialog's accessible name.
 */
describe("Modal focus", () => {
  function Harness({ bare = false }: { bare?: boolean }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen((o) => !o)}>Open</button>
        {/* `bare` disables the X and passes no controls, so nothing inside is focusable. */}
        <Modal open={open} onClose={() => setOpen(false)} title="Edit thing" dismissable={!bare}>
          {bare ? <p>read only</p> : <input aria-label="Name" />}
        </Modal>
      </>
    );
  }

  it("names the dialog by its h2 title", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Open"));
    const dialog = screen.getByRole("dialog", { name: "Edit thing" });
    const heading = screen.getByRole("heading", { level: 2, name: "Edit thing" });
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("moves focus into the panel on open and traps Tab in both directions", () => {
    render(<Harness />);
    const opener = screen.getByText("Open");
    opener.focus();
    fireEvent.click(opener);
    const close = screen.getByLabelText("Close");
    const name = screen.getByLabelText("Name");
    expect(document.activeElement).toBe(close);
    name.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(name);
  });

  it("focuses the panel itself when nothing inside is focusable, and Tab stays there", () => {
    render(<Harness bare />);
    fireEvent.click(screen.getByText("Open"));
    const dialog = screen.getByRole("dialog");
    expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(dialog);
  });

  it("returns focus to the opener on close", () => {
    render(<Harness />);
    const opener = screen.getByText("Open");
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).not.toBe(opener);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  /*
   * Found by a real-browser keyboard walk-through of a consuming hub: React applies a child's
   * `autoFocus` during commit, before the trap's effect ran, so the "previous" element it captured
   * was the input inside the panel and closing dropped focus to <body>. The opener is now captured
   * during the opening render.
   */
  it("returns focus to the opener on close even when a child has autoFocus, which keeps initial focus", () => {
    function AutoFocusHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen((o) => !o)}>Open</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Edit thing">
            <Input aria-label="Name" autoFocus />
          </Modal>
        </>
      );
    }
    render(<AutoFocusHarness />);
    const opener = screen.getByText("Open");
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

/*
 * Focus recovery (v0.23.0): Chromium blurs a focused submit button when it turns disabled
 * ("Saving…") and focus lands on <body>, so the next Tab leaves the dialog. The trap re-homes it
 * on the panel on the next frame, and leaves a deliberate move to another element alone.
 */
describe("Modal focus recovery", () => {
  const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

  function SaveHarness() {
    const [open, setOpen] = useState(true);
    const [pending, setPending] = useState(false);
    return (
      <>
        <button>Outside</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Save thing">
          <button disabled={pending} onClick={() => setPending(true)}>
            {pending ? "Saving…" : "Save"}
          </button>
        </Modal>
      </>
    );
  }

  it("moves focus to the panel when the focused control is disabled and focus falls to <body>", async () => {
    render(<SaveHarness />);
    const save = screen.getByText("Save");
    save.focus();
    // What Chromium does when the focused button becomes disabled: blur with no relatedTarget,
    // leaving focus on <body>. jsdom keeps focus on a disabled button, so the blur is explicit.
    save.blur();
    fireEvent.click(save);
    expect(document.activeElement).toBe(document.body);
    await nextFrame();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("does not override a move to another element", async () => {
    render(<SaveHarness />);
    screen.getByText("Save").focus();
    const outside = screen.getByText("Outside");
    outside.focus();
    await nextFrame();
    expect(document.activeElement).toBe(outside);
  });

  it("gives a panel without a tabindex one, so it can take the focus", () => {
    function Bare() {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(true, ref);
      return <div ref={ref} role="dialog" aria-label="Bare" />;
    }
    render(<Bare />);
    const panel = screen.getByRole("dialog");
    expect(panel.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(panel);
  });

  it("stops recovering once the dialog closes", async () => {
    render(<SaveHarness />);
    const save = screen.getByText("Save");
    save.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    (document.activeElement as HTMLElement | null)?.blur();
    await nextFrame();
    expect(document.activeElement).toBe(document.body);
  });
});
