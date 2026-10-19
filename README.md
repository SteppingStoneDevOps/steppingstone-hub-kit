# @steppingstone/hub-kit

Shared **design-system primitives** for the SteppingStone hubs — the single source of truth for the
UI kit so the hubs stop copy-pasting (and silently diverging) the same components. Mirrors the
`@steppingstone/advisor-invite` pattern: consumed **as source** (no build step) via Next's
`transpilePackages` + a Tailwind v4 `@source` line.

## What lives here

The presentational primitives that were byte-identical across advisor-hub and admin-hub:

`Button` · `Card` · `DataTable` (+ `Column`) · `Modal` · `Badge` · `CountBadge` · `EmptyState` ·
`ErrorState` · `IconButton` · `InfoHint` · `Skeleton` (+ `PageSkeleton`, `TableSkeleton`) ·
`form` (`Field`, `Input`, `Textarea`, `Select`, `Label`, `RequiredNote`, `fieldBase`) · `cn`

Styling uses the semantic Tailwind tokens (`bg-panel`, `border-border`, `text-fg`, …) that **both
hubs define** in their `globals.css @theme` block — the consuming app just needs to `@source` this
package so Tailwind scans its classes.

Since v0.18.0 the kit also needs **`--color-button`**: the fill behind white text on the primary
`Button`, `CountBadge`, the selected `AppearanceCard` option and the CRS send/next buttons. It is
separate from `--color-indigo` (links, rings, chips) so a hub can meet WCAG AA 4.5:1 for white-on-fill
without darkening its link colour. Define it in `@theme` and in the light theme; `#4866f5` gives
4.67:1 with white on dark, and the light theme can reuse its light indigo if that already passes.

## Required fields

Since v0.21.0 `<Field required>` puts an asterisk after the label (`aria-hidden`, `text-indigo`, never
red) and `aria-required` on the control. It does not set the native `required` attribute, so the
browser's validation bubble never bypasses the hub's inline `error`; the hub still validates on
submit. Render one `<RequiredNote />` ("* Required") above a form's first required field.
`autocomplete` is the hub's job, and only on fields that hold the signed-in user's own data
(WCAG 1.3.5), never on data about someone else: `PhoneInput` no longer hard-codes `tel` and sets
no attribute unless the hub passes `autoComplete="tel"` for the user's own number.

Forced colors (Windows high contrast, v0.21.0): every focusable primitive uses `outline-hidden` (a
transparent outline the system colours make visible on focus), `Button` and `IconButton` keep a
`ButtonText` border, and the selected states that were colour-only (`AppearanceCard`, the DataTable
filter) gain an underline or a `Highlight` border. Nothing sets `forced-color-adjust: none`.

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
