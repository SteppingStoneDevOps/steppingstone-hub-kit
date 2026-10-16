// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
