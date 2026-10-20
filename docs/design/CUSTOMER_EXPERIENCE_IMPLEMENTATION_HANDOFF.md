# myteam.fans — Customer Experience Implementation Recommendations

**For:** Claude Code and the product owner  
**Prepared:** October 20, 2026  
**Source:** Supplied Customer Experience & Feature Completeness Audit, based on an October 19, 2026 (MDT) site walkthrough  
**Status:** Recommendations for investigation and planning. No implementation approved.  
**Approval register:** NBA-01 through NBA-10, optional features, proposed completion criteria, and multi-league work are all **UNAPPROVED**.

## 1. Instructions to Claude Code: plan first, stop for approval

Treat this entire document as a set of recommendations. It is not a work order, an approved specification, or authorization to implement anything. Words such as “acceptance criteria,” priority labels, and sequencing describe proposals for the owner's consideration.

Your initial assignment is to inspect, validate, and propose a plan. Do not implement a recommendation merely because it appears here, has a P0 label, seems simple, or can be completed during investigation.

### Allowed during the initial planning pass

- Read the repository and its applicable instructions; inspect existing components, routes, data contracts, tests, and documentation.
- Recheck the public site through read-only interactions and existing documented read-only data access.
- Identify features already implemented, outdated audit observations, reusable functionality, dependencies, and gaps in evidence.
- Draft a separate planning document or return the plan in chat. If saving it, avoid overwriting existing project material.
- Propose code changes, tests, migrations, fixtures, and rollout steps in prose, without executing them.

### Not authorized by this handoff

- Editing application code, styles, tests, configuration, dependencies, schemas, source data, generated content, or production settings.
- Adding implementation scaffolding, “quick fixes,” migrations, ingestion jobs, or test fixtures.
- Installing dependencies, running write-producing build/test/generation commands, refreshing feeds, backfilling data, or triggering billable services during planning. Propose any necessary execution first.
- Committing, pushing, merging, deploying, publishing, or otherwise changing the live product.
- Starting multi-league development or expanding the feature scope.

After the planning pass, stop and ask the owner to approve specific task IDs and their proposed implementation scope. Do not begin implementation until the owner explicitly authorizes it. Silence, receipt of this document, agreement with the audit, and approval to investigate do not constitute implementation approval. If approval covers only part of a recommendation, implement only that approved part. Replan and obtain approval for material changes to scope, data sources, dependencies, cost, or product behavior. Deployment requires explicit authorization unless the owner has already included it in the approved scope.

Suggested approval wording for the owner: “Approve implementation of NBA-01 and NBA-04 as described in plan version [version]. Other items remain unapproved. Deployment is [included/not included].” This is an example, not an approval.

## 2. Product intent and boundaries

The proposed goal is a polished, reliable NBA team tracker that can inform a later NFL expansion. Preserve the information-first positioning:

> No ads. No bets. Just the facts.

Retain “All game. No noise.” as an alternate brand tagline. This handoff recommends no branding or advertising implementation.

Prefer fast access to scores, schedules, game details, roster information, and understandable statistics. Preserve simple navigation, readable mobile interactions, and direct access without unnecessary accounts. New capabilities should solve a concrete fan task and fit the existing product.

This is a customer-experience handoff. It does not reopen visual-design decisions, substitute for an SEO plan, or approve an architecture rewrite. Coordinate with other approved work to avoid conflicting changes.

## 3. Evidence and uncertainty

This document converts the supplied audit into planning recommendations. It does not independently revalidate the live site or its external references. The reported observations are historical evidence to investigate, not proof of the current implementation.

The original audit sampled Denver and the Lakers on desktop and at a 390 px mobile viewport. It exercised team selection, schedule list/calendar, upcoming game pages, roster controls, a player profile/game log, a returning-visit redirect, and an invalid-game page. It did not test all 30 teams, interview customers, measure performance, inspect source code, or observe a live regular-season game.

Use these classifications in the plan:

| Classification | Meaning |
| --- | --- |
| Reported observation | Directly described in the supplied walkthrough; needs current revalidation. |
| Candidate gap | Capability was not found in sampled navigation; absence is not proven. |
| Unverified behavior | The relevant state or journey was not exercised. |
| Optional enhancement | Possible benefit without demonstrated demand; not a proposed completion blocker. |

For each recommendation, report **reproduced**, **already resolved**, **implemented but hard to discover**, **not reproduced**, or **insufficient evidence**, with route/component references and next steps. Do not duplicate existing features. Customer-language statements below illustrate plausible tasks; they are not quotations from interviewed customers.

### Reference routes from the supplied audit

| Reference | URL | Reported use |
| --- | --- | --- |
| E1 | https://myteam.fans/denver-nuggets | Team overview, schedule, matchup expansion |
| E2 | https://myteam.fans/los-angeles-lakers | Team overview, schedule, preview attribution |
| E3 | https://myteam.fans/los-angeles-lakers/games/0022600005 | Upcoming game and injury wording |
| E4 | https://myteam.fans/denver-nuggets/games/0022600007 | Second upcoming game and injury wording |
| E5 | https://myteam.fans/los-angeles-lakers/players | Roster controls, statistics, mobile table |
| E6 | https://myteam.fans/los-angeles-lakers/players/doncilu01 | Player profile and game-log navigation |
| E7 | https://myteam.fans/teams | Searchable team picker |

These game routes may now represent a different game state. If so, retain the original observation and locate an appropriate current or read-only historical example; do not manufacture evidence that the original behavior still occurs.

## 4. Existing strengths recommended for preservation

- Team-first access to next game, local time, broadcast information, and schedule.
- Searchable 30-team picker and remembered team selection without an account.
- List/calendar schedule choices and expandable matchup context.
- Clear labels when roster statistics fall back to a prior season or include games for another team.
- Explanations for national/local broadcasts and unassigned NBA Cup games.
- Sortable roster statistics, per-game/totals options, and competition filters.
- Useful recovery from an invalid game link.
- Mobile table readability and access to player names while exploring additional columns.

Treat these as preservation targets for any approved change. Confirm their current behavior during planning.

## 5. Proposed backlog overview

Priorities express suggested urgency for review, not authorization. Complexity is preliminary: **S** = limited copy/interface work; **M** = multiple states or data views; **L** = substantial data/state work. Claude should replace these with repository-backed estimates.

| ID | Recommendation | Suggested priority | Evidence status | Estimate | Approval |
| --- | --- | --- | --- | --- | --- |
| NBA-01 | Correct injury availability wording | P0 | Reported observation | S | Unapproved |
| NBA-02 | Correct generated-preview provenance | P0 for attribution; forecast policy undecided | Reported observation | S–M | Unapproved |
| NBA-03 | Make supported previous-season results reachable | P1 candidate | Reported navigation gap | M | Unapproved |
| NBA-04 | Align dedicated pregame detail with its entry points | P1 candidate | Reported observation | M | Unapproved |
| NBA-05 | Add compact standings context if absent | P1 candidate | Candidate gap | M | Unapproved |
| NBA-06 | Add compact team-stat context if justified | P1 candidate | Candidate gap | M | Unapproved |
| NBA-07 | Validate and propose a team-focused postseason journey | P1 discovery candidate | Unverified postseason behavior | M | Unapproved |
| NBA-08 | Validate live-to-final reliability and propose repairs | P1 validation candidate | Unverified live behavior | M–L | Unapproved |
| NBA-09 | Link supported player game-log entries to games | P2 | Reported observation | S–M | Unapproved |
| NBA-10 | Improve discovery of additional mobile stat columns | P2 | Reported observation | S | Unapproved |

### NBA-01 — Injury availability wording

**Customer problem:** “Why does ‘not available’ include players who might play?”

**Audit evidence:** E3 and E4 reportedly placed players labeled “Day-to-day” under “NOT AVAILABLE.” This supports a wording concern, not a claim that the underlying source status was wrong.

**Recommended behavior:** Prefer a neutral “Injury report” heading while preserving each source status. Separate confirmed absences only when the source supports that distinction. Unknown or uncertain statuses should remain uncertain.

**Benefit:** Avoid implying that a player is confirmed out. **Priority:** P0 recommendation. **Complexity:** S. **Multi-league relevance:** Shared availability semantics with sport-specific source labels.

**Planning dependencies:** Locate all renderers and source-status mappings. Check team/game surfaces for inconsistent transformations. Propose the smallest copy/mapping change.

**Proposed acceptance criteria if approved:**

- No uncertain status appears under a heading asserting confirmed absence.
- Both teams retain their individual status labels and available update times.
- Confirmed-out, uncertain, missing, and unfamiliar statuses have honest representations on desktop/mobile.

### NBA-02 — Generated-preview provenance

**Customer problem:** “Is this preview really based only on the facts shown here?”

**Audit evidence:** E2 reportedly said “Written by Claude from the stats on this page” while including an ESPN matchup-predictor percentage absent from the displayed facts.

**Recommended behavior:** Make attribution accurately describe the inputs. Recommend omitting forecast percentages to align with “Just the facts”; present retaining clearly attributed forecasts as an alternative requiring the owner's decision. Do not silently remove or retain them as a settled requirement. Generated prose should not be treated as an independent source.

**Benefit:** Readers can distinguish reported facts from forecasts and understand provenance. **Priority:** P0 recommendation for misleading attribution; forecast policy is a separate decision. **Complexity:** S–M. **Multi-league relevance:** Universal.

**Planning dependencies:** Inventory generation inputs, prompts/templates, displayed facts, source timestamps, storage/caching, and existing previews. Explain whether a proposed fix would affect only future previews or also existing content. Do not regenerate content during planning.

**Proposed acceptance criteria if approved:**

- Attribution does not claim undisplayed inputs are “on this page.”
- Sampled factual claims are traceable to displayed information or an identified source.
- Any retained forecast is explicitly identified as the source's model estimate, with its source and available as-of context.
- The plan addresses existing previews and unsupported claims without inventing timestamps or sources.

### NBA-03 — Reachable previous-season results

**Customer problem:** “I shouldn't need an old link to find last season's games.”

**Audit evidence:** E2's current-season Completed view reportedly said “No games played yet” without a visible schedule season selector. E6 already offered two game-log seasons.

**Recommended behavior:** Offer a simple current/prior-season schedule choice for seasons the product can reliably support. Default to the current season and label empty states by season. Recommend a defined retention range rather than an open-ended archive.

**Benefit:** Fans can revisit results during the offseason. **Priority:** P1 candidate. **Complexity:** M. **Multi-league relevance:** Shared season navigation with league-specific season identifiers.

**Planning dependencies:** Historical schedule and game-detail availability, route/query conventions, cache keys, season definitions, and preservation of list/calendar/filter state. Identify unavailable historical details before offering links.

**Proposed acceptance criteria if approved:**

- Supported prior-season final scores are reachable from the team page.
- Each linked detail matches the game, date, and season; unsupported details are not dead links.
- Only supported seasons appear; current-season empty text identifies its scope.
- Changing seasons does not mix schedule data across years or corrupt the current-season default.

### NBA-04 — Consistent pregame destination

**Customer problem:** “Why did opening the matchup hide its channel and context?”

**Audit evidence:** E2 reportedly displayed broadcast, preview, records, season series, and injury update in the schedule expansion; E3 omitted several of these on the dedicated page.

**Recommended behavior:** Prefer keeping the dedicated game page useful as a direct link, with broadcast, local time/time zone, concise matchup context, and available source timestamps. Reuse existing data. Treat ownership of the full generated preview as an explicit product decision; it need not be duplicated everywhere.

**Benefit:** Opening or sharing a game retains essential information. **Priority:** P1 candidate. **Complexity:** M. **Multi-league relevance:** Shared pregame pattern; context varies by sport.

**Planning dependencies:** Compare hero, list, calendar, and game-page data sources; propose a shared source of truth where appropriate without an unapproved refactor.

**Proposed acceptance criteria if approved:**

- Hero, list, and calendar paths reach the correct game.
- Time, time zone, channel, and essential matchup facts agree across surfaces.
- Missing channels or context are handled honestly; regional access is not overstated.
- Direct navigation provides the agreed essential context without depending on a previous schedule expansion.

### NBA-05 — Compact standings context

**Customer problem:** “Where does my team stand in the conference?”

**Audit evidence:** Sampled navigation exposed Games and Players; matchup expansion showed record/conference but no visible standings route. This does not prove standings data or another route is absent.

**Recommended behavior:** If the gap persists, propose a compact team record/position and a route to concise standings. Keep preseason and tied positions honest. Do not add a broad league portal by default.

**Benefit:** Give results season context. **Priority:** P1 candidate. **Complexity:** M. **Multi-league relevance:** Shared standings concept, league-specific ranking rules.

**Planning dependencies:** Existing standings data/UI, source ranking, season scope, update cadence, tie handling, and postseason status availability. Avoid inferring official tiebreak outcomes from wins/losses alone.

**Proposed acceptance criteria if approved:** Position and record agree across the summary and standings for the same season/as-of context; zero-game/tied states avoid false precision; a fan can reach standings from a team page; unavailable data is distinguished from last place or zero.

### NBA-06 — Restrained team-stat summary

**Customer problem:** “I can compare players, but where are the team's own numbers?”

**Audit evidence:** E5 supplied player stats; a team-stat destination was not found in sampled navigation. No customer demand study established the required breadth.

**Recommended behavior:** First confirm current coverage. If warranted, propose a small set of core team measures, with explicit season, competition, and per-game/totals scope. League ranks are optional and should depend on reliable comparable data. Avoid advanced-stat dashboard expansion.

**Benefit:** Provide basic team-performance context. **Priority:** P1 candidate, subject to owner agreement on necessity. **Complexity:** M. **Multi-league relevance:** Shared summary pattern; measures and denominators differ by sport.

**Planning dependencies:** Owner-approved metric list, reliable team-level source, definitions, zero-game behavior, and regular-season/playoff separation. Do not derive team totals by naively summing current-roster player statistics.

**Proposed acceptance criteria if approved:** Every metric has a defined calculation and scope, reconciles to its source within documented rounding, and handles zero/missing data honestly. Rankings, if included, compare the same season and competition. Prior-season fallback is explicit.

### NBA-07 — Postseason journey discovery

**Customer problem:** “What does this playoff game mean for the series?”

**Audit evidence:** A roster Playoffs filter existed, but postseason game/series behavior was not exercised. Missing series functionality is unconfirmed.

**Recommended behavior:** Inspect supported historical playoff journeys before proposing changes. If context is absent, propose the smallest team-relevant presentation of opponent, series score, game number, available seed, and links among supported games. A full bracket remains optional. Recommend explicitly documenting play-in and NBA Cup coverage.

**Benefit:** Explain postseason stakes without excessive navigation. **Priority:** P1 discovery candidate, not an approved feature. **Complexity:** M, contingent on data. **Multi-league relevance:** Shared postseason navigation, sport-specific formats.

**Planning dependencies:** Existing postseason coverage, historical game/series data, competition identity, and handling of future unassigned matchups. Distinguish historical series state at a game's date from its eventual final result.

**Proposed acceptance criteria if approved:** A supported prior series can be followed end to end; game numbers, series context, and links are correct; future matchups are not fabricated; regular season, playoffs, play-in, and NBA Cup scope are explicit. Do not promise unsupported competitions.

### NBA-08 — Live-to-final reliability validation

**Customer problem:** “Can I trust this score, and is it current?”

**Audit evidence:** No live regular-season game was observed. Score refresh, box-score accuracy, play-by-play, finalization, and correction behavior remain unverified. This is not a confirmed live defect.

**Recommended behavior:** Propose an owner-approved validation plan covering pregame, live, halftime, overtime, delayed/postponed/cancelled states where supported, final, and later corrections. Separate validation from any repairs it reveals. Recommend a clear as-of or stale/unavailable indication where appropriate.

**Benefit:** Establish evidence for the core product promise. **Priority:** P1 validation candidate and proposed completion criterion. **Complexity:** M–L depending on findings. **Multi-league relevance:** Shared freshness/state principles, different clocks and events.

**Planning dependencies:** Source cadence/limits, existing polling/caching, timestamp meaning, game identity, read-only historical examples, and owner-approved execution. Propose a refresh tolerance based on actual capabilities; do not invent one. Future live observation is a separate scheduling decision, not permission to create an automation.

**Proposed acceptance criteria if approved:**

- Score, game state, period/clock, box score, and play-by-play reconcile within an agreed documented refresh tolerance.
- Freshness reflects source/data status rather than merely the browser refresh time.
- Stale or interrupted feeds do not imply current live data; missing data is not displayed as zero.
- Finalization and later corrections converge consistently across surfaces.
- Simulated/historical checks and observed live checks are reported separately. Untested cases remain explicit.

### NBA-09 — Game-log navigation

**Customer problem:** “I want to open the game behind this stat line.”

**Audit evidence:** E6 reportedly displayed date, opponent, result, and player stats without an apparent game-detail link.

**Recommended behavior:** Link supported entries using verified game identities. Account for games played for a former team; do not assume the currently selected team owned every game-log entry.

**Benefit:** One-step movement from a player line to game detail. **Priority:** P2. **Complexity:** S–M. **Multi-league relevance:** Universal.

**Planning dependencies:** Player/source game-ID mapping, canonical routing, historical availability, and accessible table/link behavior.

**Proposed acceptance criteria if approved:** Links open the matching date/opponent/game, including a former-team example; unsupported entries have no dead link; keyboard/touch access is clear and does not interfere with table scrolling.

### NBA-10 — Mobile stat-column discovery

**Customer problem:** “Are there more stats offscreen?”

**Audit evidence:** At 390 px, E5 exposed only some columns while more extended horizontally. The table remained usable; this was a discoverability concern, not a demonstrated blocker.

**Recommended behavior:** Propose a subtle accessible cue for additional horizontal content. Reuse any approved visual-design solution already addressing the issue. Do not squeeze columns or change the table solely to fit every stat onscreen.

**Benefit:** Help visitors discover available statistics. **Priority:** P2. **Complexity:** S. **Multi-league relevance:** Shared wide-table behavior.

**Planning dependencies:** Current overflow/sticky-name behavior, keyboard/touch scrolling, and overlap with design work.

**Proposed acceptance criteria if approved:** The cue accurately reflects remaining content and does not cover values or controls; horizontal scrolling and player-name access remain usable; the behavior works at the audited width and representative narrower/wider mobile widths.

## 6. Optional candidates and recommendations to exclude

The following remain **P3, unapproved, and outside the proposed NBA completion criteria**: league-wide player/game search, deeper historical archives, notifications, advanced-stat exploration, and a full playoff bracket. The audit did not establish demand sufficient to delay expansion. Each would need its own customer problem, scope, data assessment, and approval.

Recommend excluding betting/odds, fantasy, social feeds, engagement streaks, autoplay video, broad editorial news production, and accounts created solely to remember a favorite team. This is a scope recommendation; do not remove existing functionality under this heading without approval. Forecast policy remains the explicit NBA-02 decision.

The audit's ESPN, NBA.com, and CBS comparisons support selective expectations—reachable results, standings, team/player context, and game detail—not feature parity or proof of customer demand.

## 7. Multi-league planning recommendations

Recommend using approved NBA journeys as product patterns, while assessing technical reuse later. No multi-league implementation is authorized here.

| Shared product concept | Sport-specific decisions for a later plan |
| --- | --- |
| League/team selection and remembered preferences | Team organization, canonical routes, default league/team behavior |
| Team overview and schedule navigation | NFL weeks versus denser date-based calendars |
| Pregame/live/final/unavailable states | NBA/NFL quarters, NHL periods/shootouts, MLB innings/outs/base runners |
| Game details and event feeds | Football plays/drives, hockey shots/penalties, baseball at-bats/pitches |
| Roster/player/stat summaries | Positions, status labels, rates, denominators, competition scope |
| Standings and postseason context | Conference/division/wild-card rules, points systems, series versus single elimination |
| Season selection, time zones, freshness | Season boundaries, phases, source cadence, broadcast regions |

During inspection, identify where NBA assumptions appear in league identity, season keys, game status, statistics, injury mappings, player-team history, and broadcast logic. Report findings and bounded options. Do not replace the data model, abstract components speculatively, or begin an NFL integration without a separately approved plan.

## 8. Decisions for the owner after investigation

Claude should recommend a default and explain the cost/benefit for each unresolved decision:

1. **Preview policy:** omit forecasts, or retain clearly sourced model estimates? How should existing previews be treated?
2. **Historical coverage:** which seasons and detail levels can the product reliably promise?
3. **Pregame ownership:** which essential facts belong on the dedicated page, and where should the full preview live?
4. **Completion scope:** are compact standings and team stats required before expansion, and which specific metrics are sufficient?
5. **Competition coverage:** what is supported for regular season, playoffs, play-in, and NBA Cup?
6. **Reliability evidence:** what refresh tolerance and live observation are needed for sign-off?

Do not treat the audit's proposed answers as owner decisions. Consolidate these choices into the implementation plan so approval can be specific and reviewable.

## 9. Suggested implementation sequence, only after approval

| Proposed phase | Scope | Exit recommendation |
| --- | --- | --- |
| 0 — Inspect and plan | Revalidate NBA-01–10, trace existing behavior/data, recommend scope and estimates | Owner receives a concrete plan; Claude stops for approval |
| 1 — Trust wording | Approved portions of NBA-01/02 | Status semantics and provenance match their sources |
| 2 — Everyday journeys | Approved portions of NBA-03/04/05/06 | Supported season/game/team context is reachable and consistent |
| 3 — Postseason and reliability | Approved validation and any separately scoped repairs under NBA-07/08 | Evidence distinguishes observed success, limitations, and remaining tests |
| 4 — Convenience | Approved portions of NBA-09/10 | Navigation/discovery improve without regressions |
| 5 — Expansion readiness assessment | Separate product/codebase assessment | Owner decides whether and how to start NFL work |

Read-only investigation of all items can inform phase 0. Any later execution should follow the specific approved plan. A validation failure is evidence to propose a repair, not blanket permission for additional work.

## 10. Proposed NBA completion criteria for owner review

Recommend judging completion by successful fan journeys rather than feature count:

- Select any supported NBA team and return to it reliably.
- Find the next game, local time/time zone, broadcast information where available, and consistent pregame context.
- Reach supported current/prior-season results and available game details without dead ends.
- Understand basic team position and the owner-approved amount of team/player statistical context.
- Follow a game through live and final states with demonstrated data consistency and honest freshness/unavailable behavior.
- Follow the supported team postseason journey with accurate competition and series context.
- Interpret injury labels, generated content, forecasts if retained, timestamps, and fallbacks without misleading implications.
- Complete the agreed journeys on desktop/mobile while retaining existing strengths.

Before applying these criteria, recommend agreeing on an evidence matrix: a lightweight route/data check across all 30 teams; representative deeper checks for live/final/overtime, zero games, missing data, historical games, postseason, traded players, and mobile interaction. Choose teams based on state coverage and document exceptions. Do not claim comprehensive validation from the original two-team sample.

These criteria are proposed, not approved release gates. NBA-09/10 and P3 ideas need not delay expansion unless the owner decides otherwise. The conclusion should identify which essential journeys are verified, which remain untested, and which limitations the owner has explicitly accepted.

## 11. Required first response from Claude Code

Return a **planning-only** response containing:

1. Confirmation that no implementation has begun.
2. A recommendation-by-recommendation validation table: ID, current evidence, repository/route references, disposition, and confidence.
3. The smallest recommended change for each retained item, alternatives where a decision matters, and existing capabilities to reuse.
4. Proposed affected files/components, data/source implications, dependencies, effort, and risks. Do not invent file paths before inspection.
5. A specific validation plan with representative cases, proposed commands, expected outcomes, and rollback approach for later approved work.
6. A scoped implementation sequence distinguishing product changes, validation-only work, and optional items.
7. A short decision list and approval request naming the task IDs, scope, plan version, and whether deployment is included.

End with: **“Planning complete. Awaiting explicit approval for the identified implementation scope. No application changes have been made.”** Use this statement only if accurate; disclose any unexpected changes plainly.

The recommended next action is **codebase-informed planning and owner review**. No immediate implementation is authorized by this document.
