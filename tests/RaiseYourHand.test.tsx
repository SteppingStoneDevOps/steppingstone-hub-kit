// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RaiseYourHandModal } from "../src/RaiseYourHand";
import { RAISE_ESCAPE_LABEL } from "../src/support";

afterEach(cleanup);

/*
 * The in-product support intake. Two failures the audit found and v0.14.0 fixed are pinned here: a
 * failed submit on the describe step keeps the person's words and says so; a failed ESCAPE-HATCH
 * submit, which runs from the outcome step, says so on that step (it used to be silent).
 */
function mount(onSubmit: (i: { kind: string; text: string; escaped: boolean }) => Promise<unknown>) {
  render(
    <RaiseYourHandModal
      open
      onClose={() => {}}
      actionKey="team.members.list"
      onSubmit={onSubmit as never}
      myRequestsHref="/employer/requests"
    />,
  );
}

describe("RaiseYourHandModal", () => {
  it("a failed submit keeps the text and shows the alert on the describe step", async () => {
    mount(() => Promise.reject(new Error("down")));
    fireEvent.click(screen.getByText("Something is broken"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "The list is empty." } });
    fireEvent.click(screen.getByText("Send"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/did not go through/));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("The list is empty.");
  });

  it("a recorded report shows the outcome and the link to My Requests", async () => {
    mount(() => Promise.resolve({ outcome: "recorded", issueId: "i1" }));
    fireEvent.click(screen.getByText("Something is broken"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    fireEvent.click(screen.getByText("Send"));
    await waitFor(() => expect(screen.getByText("See it in My Requests").getAttribute("href")).toBe("/employer/requests"));
  });

  it("a failed escape-hatch submit is reported ON the outcome step", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce({ outcome: "resolved", explanation: "The module is switched off for your school." })
      .mockRejectedValueOnce(new Error("down"));
    mount(onSubmit);
    fireEvent.click(screen.getByText("Something is broken"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I cannot see CRS." } });
    fireEvent.click(screen.getByText("Send"));
    await waitFor(() => screen.getByText("That explains it"));
    fireEvent.click(screen.getByText(RAISE_ESCAPE_LABEL));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/nothing was lost/));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ escaped: true, kind: "complaint" }));
    expect(screen.getByText("That explains it")).toBeTruthy(); // still on the outcome step
  });
});
