// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "../src/DataTable";

afterEach(cleanup);

type Row = { id: string; name: string };
const columns: Column<Row>[] = [{ key: "name", header: "Name", render: (r) => r.name }];
const rows: Row[] = Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: `Row ${i}` }));

/*
 * Keyboard access (HECVAT accessibility, 2026-10-16): clickable rows are tabbable and activate on
 * Enter/Space, the icon-only pager buttons have names, and the search box has one too.
 */
describe("DataTable keyboard access", () => {
  it("makes a clickable row tabbable and activates it with Enter and Space", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} onRowClick={onRowClick} />);
    const row = screen.getByText("Row 0").closest("tr")!;
    expect(row.tabIndex).toBe(0);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    fireEvent.keyDown(row, { key: "a" });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("leaves a non-clickable row out of the tab order", () => {
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    const row = screen.getByText("Row 0").closest("tr")!;
    expect(row.hasAttribute("tabindex")).toBe(false);
  });

  it("names the pager buttons and disables the ones that cannot move", () => {
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} pageSize={4} />);
    const first = screen.getByRole("button", { name: "First page" }) as HTMLButtonElement;
    const prev = screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement;
    const last = screen.getByRole("button", { name: "Last page" }) as HTMLButtonElement;
    expect(first.disabled && prev.disabled).toBe(true);
    expect(next.disabled || last.disabled).toBe(false);
    fireEvent.click(last);
    expect(screen.getByText("Row 9")).toBeTruthy();
    expect(next.disabled && last.disabled).toBe(true);
  });

  it("names the search box, by default and from search.label", () => {
    const match = (r: Row, q: string) => r.name.toLowerCase().includes(q);
    const { unmount } = render(
      <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} search={{ match }} />,
    );
    expect(screen.getByLabelText("Search table")).toBeTruthy();
    unmount();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        search={{ match, label: "Search members" }}
      />,
    );
    expect(screen.getByLabelText("Search members")).toBeTruthy();
  });
});

/*
 * Focus is never dropped to <body> (found by a real-browser keyboard walk-through of a consuming
 * hub): Enter on "Clear search" unmounts that button, so focus goes to the search box; a pager press
 * that disables its own button hands focus to the opposite button.
 */
describe("DataTable keeps keyboard focus", () => {
  it("moves focus to the search box when Enter clears the search", async () => {
    const user = userEvent.setup();
    const match = (r: Row, q: string) => r.name.toLowerCase().includes(q);
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} search={{ match }} />);
    const box = screen.getByLabelText("Search table") as HTMLInputElement;
    await user.click(box);
    await user.keyboard("Row 3");
    expect(screen.queryByText("Row 4")).toBeNull();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Clear search" }));
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    expect(box.value).toBe("");
    expect(screen.getByText("Row 4")).toBeTruthy();
    expect(document.activeElement).toBe(box);
  });

  it("hands focus to the counterpart when Enter on a pager button disables it", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} pageSize={4} />);
    const first = screen.getByRole("button", { name: "First page" }) as HTMLButtonElement;
    const prev = screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement;
    const last = screen.getByRole("button", { name: "Last page" }) as HTMLButtonElement;

    // Next stays focused while it can still move, then yields to Previous on the last page.
    next.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Row 4")).toBeTruthy();
    expect(document.activeElement).toBe(next);
    await user.keyboard("{Enter}");
    expect(screen.getByText("Row 8")).toBeTruthy();
    expect(next.disabled).toBe(true);
    expect(document.activeElement).toBe(prev);

    // And back: Previous yields to Next on the first page.
    await user.keyboard("{Enter}");
    await user.keyboard("{Enter}");
    expect(screen.getByText("Row 0")).toBeTruthy();
    expect(prev.disabled).toBe(true);
    expect(document.activeElement).toBe(next);

    // Last <-> First.
    last.focus();
    await user.keyboard("{Enter}");
    expect(last.disabled).toBe(true);
    expect(document.activeElement).toBe(first);
    await user.keyboard("{Enter}");
    expect(first.disabled).toBe(true);
    expect(document.activeElement).toBe(last);
  });
});

/*
 * The column filter's active state was a brand tint only (WCAG 1.4.1, v0.22.0). Active now adds a
 * dot on the icon (a shape, not a colour) and puts the selection in the button's name.
 */
describe("DataTable column filter state", () => {
  type Person = { id: string; name: string; status: string };
  const people: Person[] = [
    { id: "a", name: "Ada", status: "Active" },
    { id: "b", name: "Bo", status: "Invited" },
  ];
  const cols: Column<Person>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    {
      key: "status",
      header: "Status",
      render: (r) => r.status,
      filter: { options: ["Active", "Invited"], value: (r) => r.status },
    },
  ];

  it("marks an active filter with a dot and in its accessible name, and clears both on All", () => {
    render(<DataTable columns={cols} rows={people} getRowKey={(r) => r.id} />);
    const button = screen.getByRole("button", { name: "Filter Status" });
    expect(button.querySelector("[data-filter-active]")).toBeNull();

    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Invited" }));
    const active = screen.getByRole("button", { name: "Filter Status, showing Invited" });
    expect(active).toBe(button);
    expect(active.querySelector("[data-filter-active]")).not.toBeNull();
    expect(screen.queryByText("Ada")).toBeNull();

    fireEvent.click(active);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("button", { name: "Filter Status" }).querySelector("[data-filter-active]")).toBeNull();
    expect(screen.getByText("Ada")).toBeTruthy();
  });
});
