# Live game checklist (NBA-08)

For a person to run on 2–3 games in the first week of the season, ideally including a late tip-off
and, if it happens, an overtime game. It checks that live scores and finals are trustworthy; it
changes nothing. Anything that fails becomes a separate repair proposal.

**Standard agreed with the owner (October 2026):**

- **Live:** score, quarter and clock within about a minute of ESPN's own scoreboard.
- **Final:** the site's schedule, standings and record show the final within the next hourly data
  refresh (the Cloudflare Worker starts it at :17 past each hour).

Have two screens: myteam.fans (the team page and the game page) and ESPN's scoreboard for the same
game. Note the time, the team, the page and the phone or browser for each step.

## Steps

| When | Where on myteam.fans | Check | Record |
|---|---|---|---|
| 30 min before tip-off | Team page header | Countdown says "Today"/"Tonight", correct time and channel; injury chips present. | Pass / what differed |
| 30 min before | Game page | Time box, channels, preview, injury reports with "updated" time. | Pass / what differed |
| Tip-off to 5 min in | Team page, game page | Live pill appears; game page switches to live with box scores and play-by-play. | Minutes from ESPN showing "1st" to the site showing it |
| Mid-quarter (any) | Game page | Score and clock vs ESPN. | Seconds behind; any wrong score |
| Halftime | Game page, sticky bar | Shows "Halftime"; scores match. | Pass / what differed |
| Overtime (if any) | Game page | Shows "OT"; final says "Final/OT". | Pass / what differed |
| Leave the page in the background 5+ min, come back | Game page | Score catches up within ~30 s; no stale "live" score left showing. | Pass / what differed |
| Final | Team page header, game page | "Final" with the right score. | Minutes from ESPN's final to the site's |
| After the next :17 refresh | Team page (Completed list, record, standings) | Final score in the list; record and conference table updated; "Last game" line under the countdown. | Time it appeared; anything missing |
| Next morning | Team page, player page | Next game in the countdown; player game log and "Last 5 games" (once 6+ games). | Pass / what differed |

## Also note

- Any "Couldn't refresh · last updated N min ago" or "Result pending" messages, and when.
- Anything that showed a number that wasn't true at the time (a zero for missing data, an old score
  marked live).
- Phone model and browser, and whether the site was installed as an app.
