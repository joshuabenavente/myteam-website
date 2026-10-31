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
4. **Screens** ✅ (behind `?glass=1`), no functional changes:
   - TV channels on game rows (and the player page's next game) are plain text instead of
     filled chips; local channels in bold, national ones muted.
   - The roster's three switches are one grouped card, a label and its choices per line; on
     the narrowest phones the choices' words wrap rather than run off the edge.
   - Pages start right under the header; "Published data last updated" moves to the end.
   - Not done, on purpose: the roster stays a table (sorting and comparisons need it), and the
     header's countdown stays the Games page's big next-game card.
5. **App feel** ✅ (behind `?glass=1`):
   - Pull down from the top to reload the team's data (`src/components/PullToRefresh.tsx`,
     `refresh()` from `useAppData`). The page keeps what it shows until the new data is in, a
     failed refresh keeps it, and screen readers hear "Refreshing…" then "Updated."
   - No rubber-band page or browser pull to refresh (`overscroll-behavior-y: none`), no gray
     tap flash; buttons, tabs and rows dim or tint while pressed.
   - Each page remembers how far down it was: back and forward, the tab bar, the header's page
     switcher and the back chevron return there (links marked `data-keep-scroll`); other links
     start at the top. Tapping the tab you're on scrolls to its top.
   - Touch screens get 44px targets: switches, sort buttons, the team pill, and short links
     whose tap area grows without moving anything; a roster player's whole name cell opens
     their page.
   - Splash colors were already per team: each team's manifest sets its background and theme
     color (vite.config.ts), fixed at install.
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

- `/<team>?glass=1` turns the preview on and `?glass=0` off; the choice stays on that device
  (`src/lib/glass.ts`), so the installed app, which opens at `/`, follows it.
- An installed iPhone app has its own storage and no address bar, so the installed app's footer
  has a "Glass look (preview)" switch (`src/components/GlassSwitch.tsx`). It shows only in the
  installed app; remove it when the glass look becomes the default.
- Screenshots of all 30 teams, light and dark, at 390px.
- Frame rate while the gradient moves on a mid-range Android phone.
