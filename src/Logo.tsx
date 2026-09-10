import Image from "next/image";
import { cn } from "./cn";

/**
 * SteppingStone lockup for dark surfaces: the real gradient mark (extracted from
 * the brand logo) + a white "SteppingStone" wordmark. The brand PNG's wordmark is
 * dark charcoal, so on dark backgrounds we render the wordmark as text instead.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/steppingstone-mark.png"
        alt="SteppingStone"
        width={377}
        height={336}
        priority
        className="h-6 w-auto"
      />
      <span className="text-[15px] tracking-tight text-fg">
        Stepping<span className="font-bold">Stone</span>
      </span>
    </div>
  );
}
