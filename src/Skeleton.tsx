import { cn } from "./cn";

/**
 * A single loading placeholder block. Neutral panel fill with a soft pulse
 * (drops to a static block under `prefers-reduced-motion`). Compose these to
 * mirror a screen's real layout so there's no jump when content swaps in.
 * Purely presentational — safe in server (`loading.tsx`) or client trees.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton-pulse rounded-md", className)} />;
}

/**
 * Generic in-shell page skeleton: a title bar plus a couple of panel blocks.
 * Deliberately shape-neutral so it reads fine on ANY route it covers as a
 * segment-level `loading.tsx` fallback — list, detail, or form — with no layout
 * jump when the real screen swaps in.
 */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="mt-4 h-40 w-full rounded-xl" />
    </div>
  );
}

/**
 * A skeleton standing in for the shared `DataTable` — a header strip plus
 * `rows` placeholder rows — so list screens (Advisors, Admins, Universities)
 * show the table shape while the live read resolves.
 */
export function TableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl border border-border-soft", className)}
      role="status"
      aria-label="Loading"
    >
      <div className="flex gap-4 border-b border-border-soft bg-panel-2 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border-soft/60 px-4 py-4 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "max-w-[40%]")} />
          ))}
        </div>
      ))}
    </div>
  );
}
