import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./cn";

/**
 * The shared fallback for a failed data load. Rendered by the route `error.tsx`
 * boundaries when a live read throws — a real signal we surface, never swallow
 * (the API canary pages Lynn on real breaks, so an error here is meaningful).
 * The warning icon uses the warm `yellow` accent — the platform rule reserves
 * red for allergy/alert, never for buttons/icons. `onRetry` should call the
 * boundary's `unstable_retry` so the segment re-fetches.
 */
export function ErrorState({
  title = "Couldn't load this",
  message = "Something went wrong reaching the server. This is often temporary — try again in a moment.",
  onRetry,
  retrying = false,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-panel-2 text-yellow">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-fg">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying…" : "Try Again"}
        </Button>
      )}
    </div>
  );
}
