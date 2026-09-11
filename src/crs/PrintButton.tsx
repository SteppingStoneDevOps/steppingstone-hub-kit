"use client";

import { Download } from "lucide-react";

/**
 * Export the Executive Overview as a PDF via the browser's print dialog (v1). A feature for
 * every CRS user, not a leadership-only artifact. Print-CSS polish (clean branded page) is a
 * follow-up; window.print() gives a working export today.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-hover"
    >
      <Download className="size-4" />
      Export PDF
    </button>
  );
}
