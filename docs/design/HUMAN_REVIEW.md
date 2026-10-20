# Waiting on human review

Items that need a person, not code. Nothing here is approved for implementation.

## VIS-001 — Roster stats on phones: can people find the columns offscreen?

**Status:** waiting for a short in-person test (owner decision, October 2026). Background and
the decision trail are in [VISUAL_DESIGN_IMPLEMENTATION_PLAN.md](VISUAL_DESIGN_IMPLEMENTATION_PLAN.md).

A 10-minute test you run in person, with 3–5 people who haven't used myteam.fans. It tests the
roster as it is today; nothing changes on the site.

### What's on screen today (measured)

| Phone width | Fully visible when the page opens | Cut off at the right edge | Offscreen |
|---|---|---|---|
| 390px (most iPhones) | Player, GP, MIN, PTS, REB | AST | FG%, 3P%, FT% |
| 320px (small or zoomed phones) | Player, GP, MIN | PTS | REB, AST, FG%, 3P%, FT% |

The Player column stays fixed while the stats scroll sideways. There's a faint shadow on the
right edge while more columns are offscreen. It goes away when you reach the end.

### Setup

- Use each person's own phone if you can, so the width and zoom are realistic. Note the phone
  model and whether the text size is enlarged (on iPhone: Settings › Display & Brightness › Text Size).
- Open `myteam.fans/denver-nuggets/players` beforehand and scroll the page (not the table) so the
  roster is in view. Don't touch the table itself.
- Don't mention scrolling, swiping or columns. Don't help unless someone gives up.

### Tasks (read them aloud, one at a time)

1. "Who on the Nuggets has the most assists per game?"
   - 390px: AST is cut off at the edge. 320px: AST is fully offscreen.
2. "What is Nikola Jokić's free-throw percentage?"
   - FT% is offscreen at both widths.
3. "Which player has played the most minutes?"
   - MIN is visible at both widths. This is a control task: it shows reading is fine when the
     column is in view.

### What to write down for each person and task

- **Found it?** Yes on their own / yes after a hint / gave up.
- **First thing they did:** swiped the table, scrolled the page, tapped a header, tapped a
  player, zoomed, other.
- **Time to answer**, roughly: under 10 seconds, 10–30, over 30.
- **Any wrong answer** and what they misread.
- Afterwards, ask once: "Did you notice anything telling you there were more columns?" Note whether
  they mention the cut-off column, the edge shadow, or nothing.

### Reading the results

- If everyone finds tasks 1 and 2 on their own within about 30 seconds, people are finding the
  columns. Close VIS-001 with no change.
- If 2 or more people miss an offscreen column, or first try something other than swiping, there's
  a real problem. Bring the notes back and we'll pick a small candidate hint and test it against
  today's version on the same tasks before anything goes live. (A permanent "swipe for more"
  label or a fade over the numbers is already ruled out.)
