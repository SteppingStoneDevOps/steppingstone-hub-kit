// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { Modal } from "../src/Modal";

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
