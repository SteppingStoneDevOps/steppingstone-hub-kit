# @steppingstone/hub-kit

Shared **design-system primitives** for the SteppingStone hubs — the single source of truth for the
UI kit so the hubs stop copy-pasting (and silently diverging) the same components. Mirrors the
`@steppingstone/advisor-invite` pattern: consumed **as source** (no build step) via Next's
`transpilePackages` + a Tailwind v4 `@source` line.

## What lives here

The presentational primitives that were byte-identical across advisor-hub and admin-hub:

`Button` · `Card` · `DataTable` (+ `Column`) · `Modal` · `Badge` · `CountBadge` · `EmptyState` ·
`ErrorState` · `IconButton` · `InfoHint` (+ `useHoverHint`) · `Skeleton` (+ `PageSkeleton`, `TableSkeleton`) ·
`form` (`Field`, `Input`, `Textarea`, `Select`, `Label`, `RequiredNote`, `fieldBase`, `controlBorder`) · `cn`

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

## Hover hints, control edges and links (v0.22.0)

WCAG 1.4.13: `InfoHint` and the CRS `ArchetypeChip` share `useHoverHint` (exported, for a hub's own
tooltips). Escape hides the bubble without moving the pointer or focus (and the first Escape does not
also close an enclosing `Modal`); the pointer can move onto the bubble; nothing hides it on a timer.
`InfoHint` is now a client component, and the archetype chip is a focusable button, so keyboard users
reach its tooltip. WCAG 1.4.11: text inputs, selects and textareas (`fieldBase`, the DataTable search,
the CRS and Raise Your Hand fields) use `controlBorder`, a mix of `--color-muted` into `--color-border`
(55% dark, 75% light) that reaches 3:1 on bg, panel and panel-2; cards and dividers keep
`border-border`. Icon-only controls that were `text-faint` (DataTable clear and filter) are
`text-muted`, and the `InfoHint` icon is `text-muted/80`. No new tokens: nothing changes in a hub's
`globals.css`. WCAG 1.4.1: the kit's in-text links (`SupportLine`, Raise Your Hand) were already
underlined; a test now pins it. An active DataTable column filter adds a dot on its icon and names the
selection ("Filter Status, showing Invited"), so the state is no longer colour alone. The CRS student
list's name search and major select carry `aria-label`s (they had none).

Reflow (WCAG 1.4.10, v0.22.1): a closed hint bubble is `display: none` and takes no layout width; an open
one is `position: fixed` under its trigger, placed by `useHoverHint` (`bubbleRef`, `HINT_LAYER`,
`HINT_MAX_WIDTH`): screen-wide less 16px gutters below 640px, otherwise sliding left only as far as it
must to stay on screen. Hubs can drop any `[role="tooltip"]` reflow workaround in their `globals.css`.
The CRS Year Overview header wraps at 320px.
v0.22.2: the CRS student list header and the student detail name row wrap the same way, so the
Raise Your Hand slot drops below the title or a long name at 320px instead of widening the page.

## Theme script, focus recovery, chip text (v0.23.0, 2026-10-27)

- **Server-safe theme module.** `THEME_KEY`, `ThemeChoice` and `noFlashThemeScript` live in
  `src/theme.ts`, which has no `"use client"`; `ThemeProvider` imports them from there and the package
  root still exports all three. A server `app/layout.tsx` that imported `THEME_KEY` through the client
  `ThemeProvider` got a client reference, so its inline script shipped Next's "Attempted to call
  THEME_KEY() from the server" text, threw, and a saved light theme flashed dark. Hubs drop their own
  template string and render
  `<script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />` with
  `import { noFlashThemeScript } from "@steppingstone/hub-kit"`.
- **Focus recovery** (WCAG 2.4.3): `useFocusTrap` puts focus back on the panel when the focused control
  is disabled or removed (a submit button turning into "Saving…") and focus falls to `<body>`. It acts
  on the next frame, only while the dialog is open, and never overrides a move to a real element. It
  sets `tabIndex=-1` on a panel that has none.
- **`EmptyState headingLevel`** (`1 | 2 | 3`, default 3), so an empty state directly under the h1 is an h2.
- **Chip text** (WCAG 1.4.3): `tintText` gains `brand`, `green` and `yellow` (70% token + 30% fg) and
  `Badge`, the CRS status chips, archetype chips, momentum text, stage steps and overview percentages
  use it. With the light tokens brand `#05698f`, green `#057064`, yellow `#7f5408`, red `#c0253f`,
  muted `#526178` every chip is at least 4.95:1 on bg, panel and panel-2 in both themes.

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
