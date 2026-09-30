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

## Gates

```bash
npm install
npm run typecheck   # tsc --noEmit over src
npm run test        # vitest — the rule modules (courses, departments, services, support, CRS narrative,
                    # archetypes) and behaviour tests for Modal, Raise Your Hand and the CRS student page
npm run check       # both
```

CI (`.github/workflows/ci.yml`) runs both on every push and PR to `main` and on every `v*` tag. Added
2026-09-30: before that the kit had no gates of its own and a change was proven only when each hub took
the release. A test lives here when the behaviour it pins is shared; a hub's own test covers how the hub
uses it.

## Releasing a change

1. Make the change in `src/`; add or update the test that pins it.
2. `npm run check` — green.
3. Bump `version` in `package.json` (semver: fix → patch, new prop or primitive → minor).
4. Commit, tag `vX.Y.Z`, push `main` and the tag.
5. In each consuming hub: change the pin in `package.json`
   (`github:SteppingStoneDevOps/steppingstone-hub-kit#vX.Y.Z`), `npm install`, run the hub's four gates,
   commit, push to `dev`.

Hubs pin the tag in their git dependency, so nothing changes in a hub until it takes the release.
