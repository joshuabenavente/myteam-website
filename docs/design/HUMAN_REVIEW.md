# Waiting on human review

Items that need a person, not code. Nothing here is approved for implementation.

- **NBA-08** — live scores and finals: watch 2–3 games in the first week with
  [LIVE_GAME_CHECKLIST.md](LIVE_GAME_CHECKLIST.md).
- **Later, after user feedback:** whether to add full team stats (NBA-06) and a playoff bracket (NBA-07).
- **With the player stats pass:** a **Basic | All stats** switch on the roster table. Basic (Player,
  PTS, REB, AST and one more) fits a 390 px phone without sideways scrolling; All shows every column
  and scrolls as today. Default to Basic and remember the choice on the device. To decide then:
  whether desktop shows everything regardless, and how Basic fits at 320 px. (Owner idea,
  October 20, 2026; not approved for implementation.)
- **After the live-game checklist (NBA-08): faster records after a final.** Today the final score
  shows within about a minute (live score), but the record, standings, Completed list and player
  stats wait for the hourly :17 refresh. Leading option, marked by the owner (October 20, 2026):
  **the app updates the record and recent-results line itself when the live score turns final**;
  standings still wait for the next refresh. No extra data runs. Alternatives considered: refresh
  every 15–30 minutes during game hours only (a one-line Worker schedule change); a refresh about
  5 minutes after each final (needs the Worker to watch scores; more load on Basketball-Reference,
  which blocks heavy use; runs pile up on busy nights). Undecided; no changes approved.

## Closed

- **VIS-001 / NBA-10 — roster stats on phones: closed, no change (owner decision, October 20,
  2026).** The sideways-scrolling table is accepted: more stats are coming, so the table will scroll
  anyway, and the Basic/All switch above covers phones when that happens. The in-person test
  below wasn't run; it's kept for reference.

## VIS-001 — Roster stats on phones: can people find the columns offscreen?

**Status:** closed without the test (see Closed above). Originally: waiting for a short in-person test (owner decision, October 2026). Background and
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
