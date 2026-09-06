# @steppingstone/hub-kit

Shared **design-system primitives** for the SteppingStone hubs — the single source of truth for the
UI kit so the hubs stop copy-pasting (and silently diverging) the same components. Mirrors the
`@steppingstone/advisor-invite` pattern: consumed **as source** (no build step) via Next's
`transpilePackages` + a Tailwind v4 `@source` line.

## What lives here

The presentational primitives that were byte-identical across advisor-hub and admin-hub:

`Button` · `Card` · `DataTable` (+ `Column`) · `Modal` · `Badge` · `CountBadge` · `EmptyState` ·
`ErrorState` · `IconButton` · `InfoHint` · `Skeleton` (+ `PageSkeleton`, `TableSkeleton`) ·
`form` (`Field`, `Input`, `Textarea`, `Select`, `Label`, `fieldBase`) · `cn`

Styling uses the semantic Tailwind tokens (`bg-panel`, `border-border`, `text-fg`, …) that **both
hubs define** in their `globals.css @theme` block — the consuming app just needs to `@source` this
package so Tailwind scans its classes.

## Consuming it (already wired in both hubs)

1. `package.json` → `"@steppingstone/hub-kit": "github:SteppingStoneDevOps/steppingstone-hub-kit#v0.1.0"`
2. `next.config.ts` → `transpilePackages: ["@steppingstone/advisor-invite", "@steppingstone/hub-kit"]`
3. `app/globals.css` → `@source "../node_modules/@steppingstone/hub-kit/src";`

Then import from `@steppingstone/hub-kit` (or via the hub's existing `@/components/ui/*` re-export
shims, which point here).

## Versioning

Tag releases (`v0.1.0`, …); hubs pin the tag in their git dependency. Bump the tag when you change a
primitive, then update the hubs' pin.
