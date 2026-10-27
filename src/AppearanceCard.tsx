"use client";

import { Card } from "./Card";
import { useTheme } from "./ThemeProvider";
import type { ThemeChoice } from "./theme";
import { cn } from "./cn";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Appearance / color-scheme picker, wired to the platform theme. */
export function AppearanceCard() {
  const { choice, setChoice } = useTheme();
  return (
    <Card>
      <h3 className="text-sm font-semibold text-fg">Appearance</h3>
      <div className="mt-3 inline-flex gap-1 rounded-full border border-border bg-panel-2 p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={choice === o.value}
            onClick={() => setChoice(o.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              // The fill is the selected marker; under forced colors the fill goes, so underline it.
              choice === o.value
                ? "bg-button text-white shadow-sm forced-colors:underline"
                : "text-muted hover:text-fg",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
