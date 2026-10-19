"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListFilter,
  Search,
  X,
} from "lucide-react";
import { cn } from "./cn";
import { controlBorder } from "./form";
import { useEscapeToClose } from "./Modal";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
  /** Adds a functional filter icon to this column's header. */
  filter?: { options: string[]; value: (row: T) => string };
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  rowClassName,
  search,
  toolbarRight,
  pageSize = 8,
  emptyMessage = "No items",
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Extra classes per row — e.g. to de-emphasize a deactivated member. */
  rowClassName?: (row: T) => string;
  /** enable a search box; returns true if row matches the query. `label` is the box's accessible name. */
  search?: { placeholder?: string; label?: string; match: (row: T, q: string) => boolean };
  toolbarRight?: React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const pagerRefs = {
    first: useRef<HTMLButtonElement>(null),
    prev: useRef<HTMLButtonElement>(null),
    next: useRef<HTMLButtonElement>(null),
    last: useRef<HTMLButtonElement>(null),
  };
  type Pager = keyof typeof pagerRefs;
  const COUNTERPART: Record<Pager, Pager> = { first: "last", last: "first", prev: "next", next: "prev" };

  // Keyboard focus must not fall to <body> when the control that had it goes away (WCAG 2.4.3):
  // clearing the search unmounts the X, so focus goes to the search box; a pager press that
  // disables its own button hands focus to the opposite button (Next <-> Previous, First <-> Last)
  // or, if that one is disabled too, to the table wrapper.
  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }
  function goToPage(target: number, from: Pager) {
    const self = pagerRefs[from].current;
    // Read focus BEFORE the commit: Chromium blurs a button the instant it becomes disabled, so
    // after flushSync `document.activeElement` is already <body> and the check would never fire.
    const hadFocus = self != null && self === document.activeElement;
    // Commit synchronously so the buttons' `disabled` state is the post-move one before we read it.
    flushSync(() => setPage(target));
    if (!hadFocus || !self?.disabled) return;
    const other = pagerRefs[COUNTERPART[from]].current;
    (other && !other.disabled ? other : tableRef.current)?.focus();
  }

  const filtered = useMemo(() => {
    let out = rows;
    if (search && query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => search.match(r, q));
    }
    for (const c of columns) {
      const sel = colFilters[c.key];
      if (c.filter && sel && sel !== "All") {
        out = out.filter((r) => c.filter!.value(r) === sel);
      }
    }
    return out;
  }, [rows, query, search, columns, colFilters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + pageSize, filtered.length);

  return (
    <div>
      {(search || toolbarRight) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {search ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={search.placeholder ?? "Search..."}
                aria-label={search.label ?? "Search table"}
                className={`h-9 w-full rounded-lg border ${controlBorder} bg-bg/60 pl-9 pr-8 text-sm text-fg placeholder:text-faint focus:border-brand/70 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand`}
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          {toolbarRight}
        </div>
      )}

      {/* tabIndex={-1}: a programmatic focus target of last resort for the pager (see goToPage). */}
      <div
        ref={tableRef}
        tabIndex={-1}
        className="overflow-hidden rounded-xl border border-border-soft focus:outline-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft bg-panel-2 text-left text-sm font-semibold text-muted">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-semibold", c.className)}>
                  <span className="inline-flex items-center gap-2">
                    {c.header}
                    {c.filter && (
                      <FilterMenu
                        label={`Filter ${c.header}`}
                        options={c.filter.options}
                        value={colFilters[c.key] ?? "All"}
                        onSelect={(v) => {
                          setColFilters((f) => ({ ...f, [c.key]: v }));
                          setPage(0);
                        }}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-faint"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  // A clickable row is also keyboard-reachable: tabbable, and Enter/Space activate it.
                  // The row keeps its native table role (role="button" on a <tr> would strip the
                  // row/cell semantics for screen readers); keys from a nested control are left alone.
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-border-soft/60 last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-hover focus-visible:bg-hover",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3.5 text-fg", c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-border-soft px-4 py-2.5 text-xs text-muted">
          <div className="flex items-center gap-1">
            <PagerButton
              ref={pagerRefs.first}
              label="First page"
              disabled={current === 0}
              onClick={() => goToPage(0, "first")}
            >
              <ChevronsLeft className="size-4" />
            </PagerButton>
            <PagerButton
              ref={pagerRefs.prev}
              label="Previous page"
              disabled={current === 0}
              onClick={() => goToPage(current - 1, "prev")}
            >
              <ChevronLeft className="size-4" />
            </PagerButton>
            <span className="mx-1 min-w-6 rounded bg-panel-2 px-2 py-0.5 text-center text-fg">
              {current + 1}
            </span>
            <PagerButton
              ref={pagerRefs.next}
              label="Next page"
              disabled={current >= pageCount - 1}
              onClick={() => goToPage(current + 1, "next")}
            >
              <ChevronRight className="size-4" />
            </PagerButton>
            <PagerButton
              ref={pagerRefs.last}
              label="Last page"
              disabled={current >= pageCount - 1}
              onClick={() => goToPage(pageCount - 1, "last")}
            >
              <ChevronsRight className="size-4" />
            </PagerButton>
          </div>
          <span className="tabular">
            {rangeStart} - {rangeEnd} of {filtered.length} items
          </span>
        </div>
      </div>
    </div>
  );
}

function PagerButton({
  children,
  label,
  disabled,
  onClick,
  ref,
}: {
  children: React.ReactNode;
  /** Accessible name — the button is icon-only. */
  label: string;
  disabled?: boolean;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function FilterMenu({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const active = value !== "All";

  // The backdrop is click-only; Escape is the keyboard way out, and focus goes back to the
  // filter button so a keyboard user is not dropped at the top of the document.
  const dismiss = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus();
  }, []);
  useEscapeToClose(open, dismiss);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((o) => !o);
  }

  return (
    <span className="inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          "relative rounded p-0.5 transition-colors",
          // The active tint is colour only; under forced colors a Highlight border marks it instead.
          active ? "text-brand forced-colors:border forced-colors:border-[Highlight]" : "text-muted hover:text-fg",
        )}
        // The name carries the state too (WCAG 1.4.1 / 4.1.2): "Filter Status, showing Active".
        aria-label={active ? `${label}, showing ${value}` : label}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <ListFilter className="size-3.5" aria-hidden />
        {/* Active marker that is not colour alone: a dot appears on the icon (a shape, present or
            absent). CanvasText keeps it under forced colors, where the fill would otherwise go. */}
        {active && (
          <span
            data-filter-active=""
            aria-hidden
            className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-brand forced-colors:bg-[CanvasText]"
          />
        )}
      </button>
      {/* Portaled to <body> so it isn't clipped by the table's overflow-hidden. */}
      {open &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              role="group"
              aria-label={label}
              className="fixed z-50 max-h-72 w-44 overflow-y-auto rounded-lg border border-border bg-panel-2 p-1 shadow-xl"
              style={{ top: pos.top, left: pos.left }}
            >
              {["All", ...options].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={opt === value}
                  onClick={() => {
                    onSelect(opt);
                    dismiss();
                  }}
                  className={cn(
                    "block w-full rounded px-2 py-1.5 text-left text-sm normal-case transition-colors hover:bg-hover",
                    opt === value ? "text-brand forced-colors:underline" : "text-fg",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </span>
  );
}
