# myteam.fans — implementation coordination

Version 1.0 · Documentation review: October 19, 2026 (America/Denver)

Read with [customer-experience handoff](CUSTOMER_EXPERIENCE_IMPLEMENTATION_HANDOFF.md) and [SEO handoff](SEO_IMPLEMENTATION_HANDOFF.md). Those files retain task definitions and acceptance criteria. This document coordinates execution; it does not approve work or establish new site findings. Preserve NBA-01–NBA-10 and SEO-01–SEO-11.

## 1. Initial assignment and approval boundary

Start with read-only investigation and a concrete implementation plan for both handoffs. Inspect applicable repository instructions, current branch/commit, deployment identity, existing capabilities, data sources, scripts, and tests. Revalidate historical observations and distinguish repository evidence, public HTTP evidence, and authenticated search evidence. A newer observation supersedes an older assumption only with recorded evidence.

Allowed now: reading existing material, ordinary read-only site checks and existing authorized read-only access, and drafting a separate plan without overwriting project material. No application, configuration, dependency, test, fixture, data, generated-content, or production edits. Do not install, build, regenerate, ingest, backfill, commit, push, merge, or deploy during planning. Inspect scripts before proposing execution. Do not create monitoring automations.

Treat SEO §13 commands as later validation proposals. Split SEO-01 diagnosis from remediation and NBA-08 validation from repairs. Discovering a defect does not authorize its repair. The source documents' priorities and completion criteria remain proposals.

Request implementation approval once the plan is reviewable, naming IDs, bounded scope, plan version, command execution, and deployment inclusion. Record partial approvals explicitly. Hosting/DNS changes, property setup, sitemap submission/reprocessing, billable activity, and content regeneration need applicable explicit authorization. Existing owner authorization remains effective within its stated scope. Seek renewed approval for material scope, dependency, source, cost, or behavior changes; continue independent authorized work.

## 2. Shared decisions and dependencies

| Tasks | Shared prerequisite / coordination rule |
| --- | --- |
| SEO-01, SEO-02, SEO-03, SEO-05 | Measure direct responses, variants, initial/rendered HTML and failed resources first. Preserve helpful offline UI; do not presume it caused an indexing defect. Propose the smallest supported delivery change. |
| SEO-08, SEO-02, NBA-03, NBA-07, NBA-09 | Investigate retained seasons, stable source/game/player IDs, trades, competition scope, and supported details before offering links or generating pages. Owner chooses retention scope. Correct removal status is acceptable where retention is unsupported. |
| SEO-04, SEO-05, SEO-06, SEO-08, NBA-03, NBA-04, NBA-09 | Propose one URL policy: host/slash/query handling, picker representative, season selection, game duplicates, player/team history. Preserve NBA paths and team context. Compare both game perspectives before choosing a canonical; do not assume the home-team URL wins. |
| NBA-01, NBA-02, NBA-04, SEO-02, SEO-03, SEO-09 | Share factual status, attribution, season, timestamp and missing-data rules across visible content, static HTML, metadata and schema. Forecast policy and treatment of existing previews require an owner decision. No automatic preview regeneration. |
| NBA-04, NBA-09, SEO-07 | Coordinate schedule and game-log anchors with direct game destinations and supported IDs. Avoid competing tap targets or links to unavailable historical pages. |
| NBA-08, SEO-02, SEO-03, SEO-11 | Establish baseline and freshness semantics before rendering changes. Separate source timestamps from browser refresh time, and static snapshots from live data. Preserve local times, PWA/offline behavior, and score updates. Agree on tolerances before judging reliability. |
| NBA-05, NBA-06, NBA-07, SEO league/standings opportunities | Reuse verified capabilities; new standings, stats, postseason views or URLs require selected product scope. SEO opportunities do not authorize features. |
| NBA-10, SEO-11, existing visual work | Check current overflow behavior and approved design work before proposing another mobile-table change. |

The plan must state the shared entity/data policy before affected implementation: league, season/competition, team, player and game identity; supported data; URL representative; source/as-of semantics; and unavailable/removed behavior. Reuse existing contracts where adequate. This is a decision requirement, not an instruction to introduce a new architecture.

## 3. Sequence and ownership

1. **Inspect and propose:** revalidate all IDs; prioritize SEO-01 diagnosis, SEO-08 retention/identity discovery, NBA-01/02 trust findings, NBA-08 feasibility, and SEO-11 baseline availability. Record missing access and continue independent inspection.
2. **Owner decisions:** settle affected URL/retention policy, forecasts and existing previews, essential pregame facts, required standings/stats, competition coverage, refresh tolerance, and accepted limitations. Obtain specific implementation approval.
3. **Approved implementation:** small trust fixes may proceed independently. Implement approved route/content delivery under SEO-02/03 after their prerequisites. Coordinate NBA-03/04/07/09 with supported data and destinations; sequence NBA-05/06/08/10 only as selected. SEO-04/05 must agree on URL policy before SEO-06/07 consume it. This orders changes, not numbering.
4. **Conditional polish:** SEO-09/10 follows stable facts/metadata; SEO-11 optimizes only evidenced issues. NFL, broad archives, full brackets and other optional features remain separate decisions.
5. **Validate and release:** run approved repository/preview checks, obtain any outstanding release authorization, then perform production and external checks within the granted scope.

The plan assigns one accountable change owner per shared file/surface after inspection. A shared change may satisfy multiple IDs; list each one and retain its distinct criteria. Do not assume separate implementation agents or duplicate edits. Coordinate with any already approved work before modifying the same surface.

## 4. Evidence and completion tracking

Create one row per original ID with: current disposition and confidence; evidence/commit/URL/date; proposed scope and affected files; dependencies and owner; approval scope/plan version; implementation state; validation results; outstanding access or decisions. Do not invent paths or commands before inspection.

Keep these dimensions separate:

- **Finding:** reproduced / already resolved / implemented but hard to discover / not reproduced / insufficient evidence.
- **Approval:** unapproved / approved scope with owner record and plan version.
- **Delivery:** planned / implemented / preview verified / production verified; identify blocked or not-applicable stages.
- **Search evidence:** live inspection / indexed inspection / unavailable or pending, with provider and date.

SEO checklist boxes stay unchecked until applicable production acceptance passes. If deployment or authenticated checks remain pending, report that explicitly even when code and preview checks pass. Lack of indexing immediately after release is not itself proof of failure. Explain any proposed acceptance-criterion revision for owner review rather than silently weakening it.

Reuse one evidence matrix for overlapping checks: picker/saved-team flow, representative teams/rosters, traded player, upcoming and completed game, both team game variants, supported prior season, unknown IDs, slash variants and `/games/live`; include mobile/keyboard, missing data, freshness and offline behavior. Separate simulated, historical and observed-live evidence. Follow the detailed source gates for selected tasks; a two-team sample does not establish all-team coverage. No comprehensive pass claim from a build or screenshot alone.

## 5. Claude Code handoff prompt

Read this coordination document, both linked handoffs, and applicable repository instructions. Perform a planning-only review against the current repository and deployed behavior using read-only methods. Do not edit the application or run write-producing commands. Preserve all NBA and SEO task IDs; recommendations and priorities are not approvals.

Return a versioned plan containing: (1) current branch/commit and deployment evidence; (2) a validation/disposition row for every ID with references and confidence; (3) smallest recommended changes, reusable capabilities and alternatives; (4) the shared dependencies, affected files, data/source implications, owners, effort and risks; (5) proposed commands, expected results, representative checks and rollback approach; and (6) owner decisions plus a specific approval request naming task IDs, scope, plan version and deployment inclusion. Separate diagnosis from repair, product work from validation, and code completion from production/search verification. Document unavailable access without guessing. Do not perform implementation while preparing the plan.

If accurate, end: **“Planning complete. Awaiting explicit approval for the identified implementation scope. No application changes have been made.”**
