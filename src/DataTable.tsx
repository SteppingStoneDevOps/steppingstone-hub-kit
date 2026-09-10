"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  /** enable a search box; returns true if row matches the query */
  search?: { placeholder?: string; match: (row: T, q: string) => boolean };
  toolbarRight?: React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

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
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={search.placeholder ?? "Search..."}
                className="h-9 w-full rounded-lg border border-border bg-bg/60 pl-9 pr-8 text-sm text-fg placeholder:text-faint focus:border-brand/70 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-fg"
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

      <div className="overflow-hidden rounded-xl border border-border-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft bg-panel-2 text-left text-sm font-semibold text-muted">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-semibold", c.className)}>
                  <span className="inline-flex items-center gap-2">
                    {c.header}
                    {c.filter && (
                      <FilterMenu
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
                  className={cn(
                    "border-b border-border-soft/60 last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-hover",
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
            <PagerButton disabled={current === 0} onClick={() => setPage(0)}>
              <ChevronsLeft className="size-4" />
            </PagerButton>
            <PagerButton disabled={current === 0} onClick={() => setPage(current - 1)}>
              <ChevronLeft className="size-4" />
            </PagerButton>
            <span className="mx-1 min-w-6 rounded bg-panel-2 px-2 py-0.5 text-center text-fg">
              {current + 1}
            </span>
            <PagerButton
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight className="size-4" />
            </PagerButton>
            <PagerButton
              disabled={current >= pageCount - 1}
              onClick={() => setPage(pageCount - 1)}
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
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function FilterMenu({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const active = value !== "All";

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
          "rounded p-0.5 transition-colors",
          active ? "text-brand" : "text-faint hover:text-fg",
        )}
        aria-label="Filter"
      >
        <ListFilter className="size-3.5" />
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
              className="fixed z-50 max-h-72 w-44 overflow-y-auto rounded-lg border border-border bg-panel-2 p-1 shadow-xl"
              style={{ top: pos.top, left: pos.left }}
            >
              {["All", ...options].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded px-2 py-1.5 text-left text-sm normal-case transition-colors hover:bg-hover",
                    opt === value ? "text-brand" : "text-fg",
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
