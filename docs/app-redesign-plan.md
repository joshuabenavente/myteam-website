# Glass app redesign

Turning myteam.fans into something that looks and feels like an app, keeping today's
functionality. The team page and player pages are the focus; live game pages are out of scope.

**Visual targets:** frosted glass over a slowly moving team-colored gradient (the "Goalify"
football app shots), with Apple Sports' clean layout and restraint: big type, little chrome,
glass only where it carries content.

**Decisions (October 2026):**

- Dark first. Light mode stays, as a lighter tint of the same gradient.
- Keep Atkinson Hyperlegible Next.
- Stay a PWA (see [installable-app.md](installable-app.md)). An app store wrapper (Capacitor)
  only if store distribution is wanted later.
- Text contrast (WCAG AA, 4.5:1) is a hard requirement over the moving gradient.

This direction supersedes the "no visual changes approved" status of
[design/VISUAL_DESIGN_IMPLEMENTATION_PLAN.md](design/VISUAL_DESIGN_IMPLEMENTATION_PLAN.md).

## Steps

1. **The gradient becomes the app's background** ✅ (behind `?glass=1`). One fixed layer behind
   the page (`src/components/AppAtmosphere.tsx`, `.app-atmosphere` in `App.css`), colored from
   each team's theme for all 30 teams (`glassColors` in `src/lib/teamColors.ts`). Only
   `transform` animates; Reduce Motion stops it; hidden in forced colors.
2. **Glass material** ✅ (behind `?glass=1`). `html.glass` tokens: `--glass-fill`, `--glass-edge`,
   `--glass-blur`, `--glass-panel` (team-colored panels with white text), `--glass-solid` (sticky
   table cells). Cards get the blur; rows inside them get the fill alone. Reduce Transparency
   gets opaque fills.
3. **App shell** ✅ (behind `?glass=1`). On phones, a floating tab bar (Games, Players, Teams;
   `src/components/TabBar.tsx`) replaces the header's and sticky bar's page switchers. Player and
   game pages put a back chevron where the logo was, in the header and the sticky bar, in place
   of the "All players" / "All games" link. Tapped links cross-fade (View Transitions; not back
   and forward, which phones animate themselves, and not with Reduce Motion). After a page
   change, focus moves to the content without scrolling past the header. Bars that content
   scrolls under (`--glass-bar`) are near-opaque, so their white text is readable over anything.
4. **Screens, no functional changes.** Games: a big next-game card, minimal schedule rows,
   list/calendar as a pill control. Players: rows with headline stats that open the player page.
   Player page: hero over the gradient, radar and game log in glass cards. Tabular numerals and
   a stronger type scale.
5. **App feel.** Pull to refresh (refetch data), `overscroll-behavior`, no tap highlight,
   per-team splash colors, 44px targets, scroll position kept per tab.
6. **Later.** Notifications (installable-app.md), then deciding whether to drop the flag.

Steps 3–5 land as separate changes, still behind the flag, until the glass app replaces the
current look.

## How contrast is kept

Text can sit straight on the gradient, on glass, or on a team panel, and the gradient moves, so
contrast is checked against its extreme spots rather than a screenshot. `glassColors` bounds
the glows' brightness (dark mode) or darkness (light mode), a veil covers the whole gradient,
and the team's link, accent, win and loss colors are adjusted until they pass on every surface
they can land on. `src/lib/glassColors.test.ts` checks every team in both modes without
counting on the blur, so browsers without `backdrop-filter` stay readable too. The fills,
veils and alphas in `App.css` must match the `GLASS_*` constants.

## Checking it

- `/<team>?glass=1` (links keep the flag); compare with the same page without it.
- Screenshots of all 30 teams, light and dark, at 390px.
- Frame rate while the gradient moves on a mid-range Android phone.
