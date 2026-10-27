import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

/**
 * The one empty-state look for the app: a muted icon disc, a title, an optional
 * line of guidance, and an optional call-to-action. Use on any read screen that
 * can legitimately have no rows yet (no appointments, no caseload, no requests)
 * so an empty read reads as "nothing here yet," never as a broken screen.
 * Presentational — pass an interactive `action` from a client component.
 * `headingLevel` (default 3) keeps the outline in order (WCAG 1.3.1): pass 2 when the empty state
 * sits directly under the page's h1, or 1 when it is the whole page.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  headingLevel = 3,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-panel-2 text-faint">
        <Icon className="size-6" aria-hidden />
      </div>
      <Heading className="mt-4 text-base font-semibold text-fg">{title}</Heading>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
