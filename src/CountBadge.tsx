import { cn } from "./cn";

/** Small accent (indigo) unread count pill. Renders nothing when count is 0. */
export function CountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo px-1 text-[10px] font-semibold text-white",
        className,
      )}
    >
      {count}
    </span>
  );
}
