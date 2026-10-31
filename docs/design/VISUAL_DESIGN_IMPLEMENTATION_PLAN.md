# Visual Design Implementation Plan — myteam.fans

> **Superseded (October 2026):** the glass app redesign in [../app-redesign-plan.md](../app-redesign-plan.md) is approved and in progress behind `?glass=1`.

**Decision status:** No visual implementation is currently approved.  
**Basis:** Initial visual audit and subsequent adversarial review, October 2026.  
**Purpose:** A decision record and controlled handoff for Claude Code. This document does not authorize changes to the website.

## 1. Executive summary

The inspected dark-mode, preseason pages are visually effective and do not warrant a redesign. The adversarial review found **no P1 or P2 change ready for implementation**. Two mobile concerns are worth validating before any code change: discovery of horizontally scrolled roster statistics and readability of unusually dense injury reports at very narrow widths. An alternative player-stat visualization remains a subjective, lower-priority idea. All three are P3 and excluded from implementation without explicit approval.

The first audit's proposed channel-badge adjustment is rejected. Its proposed calendar detail is rejected because the selected-game detail panel already exists. Claude Code must not infer an implementation mandate from the existence of this plan. If no new approval accompanies it, inspect the codebase as requested in Phase 0, report that the implementation backlog is empty, and make no website changes.

**Review coverage:** `/teams`; Denver games, roster, Nikola Jokić profile, and scheduled-game detail; Boston, Lakers, and Miami palettes; desktop and 390 px mobile, with narrower 320 px checks for roster and injury density. Search, roster sorting, list/calendar switching, calendar selection, and expanded game rows were observed. The browser was in dark mode. Light mode, live scores, completed-game box scores, and play-by-play were not verified; do not treat them as reviewed findings.

## 2. Design principles and non-negotiable constraints

- Preserve application functionality, information architecture, navigation, data, statistics, and existing interaction semantics.
- Do not change business logic, APIs, data fetching, or the meaning of local versus national broadcast presentation.
- Preserve the team-specific branding system and use existing design tokens, shared components, and styling conventions where applicable.
- Preserve information density, numerical alignment, readability, keyboard access, touch usability, and accessibility.
- Any future approved change must work in both light and dark modes and across contrasting team palettes.
- Do not add dependencies without a demonstrated need, decorative elements that compete with content, unnecessary animation, broad redesigns, or unrelated refactoring.
- Do not prescribe or assume file paths, selectors, component names, theme implementation, or test commands before inspecting the codebase.
- An unverified concern is a hypothesis, not a defect or an authorization to change production UI.

## 3. Final approved recommendations

**None.** The challenge pass did not establish a visual change with a sufficiently clear benefit and low enough usability risk to approve immediate implementation. Consequently, there are no P1 or P2 tasks. The two mobile concerns below are validation candidates only.

## 4. Prioritized implementation backlog

| Priority | Task ID | Title | Status | Implementation eligibility |
| --- | --- | --- | --- | --- |
| P1 | — | High-value refinements | None approved | No work |
| P2 | — | Secondary improvements | None approved | No work |
| P3 | VIS-001 | Validate mobile roster stat discovery | Unapproved experiment | Excluded until explicit approval |
| P3 | VIS-002 | Compare narrow injury layouts | Unapproved experiment | Excluded until explicit approval |
| P3 | VIS-003 | Consider player-stat chart alternatives | Shelved aesthetic exploration | Excluded until explicit approval and a comparison use case |

P3 IDs identify possible studies, not implementation tickets. Do not create production UI, prototypes in the website, or new tests for them unless the user explicitly authorizes that work. A successful experiment would require a separate approval that specifies the production change before its priority can become P1 or P2.

## 5. Detailed task specifications and acceptance criteria

### VIS-001 — Validate mobile roster stat discovery (P3; not approved)

- **Affected page/component:** Team `/players` roster table at phone widths.
- **Observed condition:** At a 390 px viewport, the table content was approximately 521 px wide within a 341 px scroll area. Some statistics are initially offscreen. Horizontal scrolling works, and the Player column remains fixed. At 320 px, a partial next column provides some continuation signal. No user failure was observed.
- **Candidate change, only if later approved:** A minimal, transient indication that more columns are available. The original permanent “Swipe for more stats” label and edge fade are **not** approved solutions.
- **Justification and expected outcome:** Only a demonstrated discovery failure would justify a cue; the desired outcome is finding offscreen statistics without reducing the visible data area or obscuring numbers.
- **Risks:** Persistent instruction text consumes vertical space; a fade may cover values; either can add noise to every roster visit.
- **Dependencies:** Explicit authorization for a validation study, followed by a separate decision on any implementation. Phase 0 must identify the actual table/scroller and responsive behavior.
- **Experiment completion criteria:** At 320 px and 390 px, observe first-time users trying to find an initially offscreen statistic without a prompt about scrolling. Record whether they succeed, their first action, delays or errors, and whether the fixed Player column aids comparison. If a candidate cue is tested, compare it against the unchanged baseline and record any obscured data or added vertical space. No production change follows automatically.
- **Verification method:** Real or appropriately representative mobile interaction, plus browser inspection of both the initial and horizontally scrolled table. Do not substitute a static screenshot for a discovery test.

### VIS-002 — Compare narrow injury layouts (P3; not approved)

- **Affected page/component:** Scheduled-game matchup card, particularly games with long injury lists.
- **Observed condition:** A Lakers–Warriors scheduled game with many listed injuries is tightly wrapped in two columns at 320 px; inspected injury names used roughly 12.5 px text. The same arrangement is substantially more comfortable at 390 px and desktop width. No truncation or failed reading task was demonstrated.
- **Candidate change, only if later approved:** Compare the existing two-column card with a narrowly scoped layout variation at approximately 320–350 px for dense reports. The original suggestion to stack below 420 px or enlarge all injury copy is **not** approved.
- **Justification and expected outcome:** A candidate must improve accurate reading of player, status, and condition in the narrow, dense case while preserving both teams' information and reasonable card height.
- **Risks:** Stacking can lengthen the page and impede side-by-side comparison; larger type can increase wrapping. Hiding injuries is outside scope.
- **Dependencies:** Explicit authorization for a comparison, access to a dense representative game, and Phase 0 inspection of responsive and theme rules. Any production change needs separate approval.
- **Experiment completion criteria:** Compare baseline and candidate at 320 px, 390 px, and desktop width using identical injury content. Document line wrapping, card height, and whether users can identify each team's player, status, and condition without misreading. Compare light and dark modes and at least two contrasting palettes before proposing a production task. Preserve every injury and its status.
- **Verification method:** Side-by-side rendered captures and reading tasks on the same content; keyboard and touch inspection if the candidate changes interaction. Do not declare the candidate better solely because it looks less dense.

### VIS-003 — Consider player-stat chart alternatives (P3; shelved)

- **Affected page/component:** Individual player “At a glance” visualization.
- **Observed condition:** The current radar chart displays exact labeled values and gives the profile visual character. No comparison task or comprehension problem was established.
- **Candidate change, only if later approved:** Compare aligned bars with the existing chart if player-to-player comparison becomes an explicit product requirement. No replacement is currently requested.
- **Justification and expected outcome:** None established for the present individual-profile task. A future experiment would need to show clearer comparison without losing access to the exact values.
- **Risks:** A generic chart could consume more space or reduce the profile's identity without helping the current task.
- **Dependencies:** Explicit product need and user authorization for a visual experiment; separate approval for any implementation.
- **Experiment completion criteria:** Define the comparison task first, use identical statistics and labels in both versions, and assess comprehension and occupied space across desktop/mobile and both themes. Without that task definition, close the experiment with no change.
- **Verification method:** Side-by-side task-based comparison, not preference voting alone.

## 6. Implementation phases and dependencies

| Phase | Work | Completion condition |
| --- | --- | --- |
| **0 — Codebase inspection** | Before any future authorized change, locate the existing design tokens, shared components, responsive table/card behavior, theme handling, relevant pages, and available checks. Verify the assumptions above against code and rendered UI. | A concise inventory identifies the actual implementation points and any mismatch with this plan. With the current empty P1/P2 backlog, stop here and report no authorized production changes. |
| **1 — Foundational refinements** | No approved typography, spacing, color, or shared-component work. | Skipped unless a new approved P1/P2 task explicitly requires it. |
| **2 — Page-specific refinements** | No approved page changes. | Skipped unless a new approved P1/P2 task explicitly requires it. |
| **3 — Verification** | For any later approved implementation, run the applicable checklist in Section 8, inspect rendered affected pages, and compare against the unchanged baseline. | Evidence shows the specified acceptance criteria pass without meaningful functional, accessibility, density, or theme regressions. Otherwise revert or report the conflict. |
| **4 — Final review** | Report task status, deviations, changed files, checks, screenshots or observations, and unresolved concerns. | The report distinguishes approved changes from experiments and states clearly if no code changed. |

Phase 0 is a prerequisite for any implementation; P3 validation and production approval are separate prerequisites for promoting either mobile hypothesis. Do not fill an empty phase with unrelated polish work.

## 7. Cross-page and cross-theme considerations

The prior visual evidence covered Denver navy/gold, Boston green, Lakers purple/gold, and Miami red in dark mode. A future change to a shared component must be checked on contrasting palettes rather than only Denver. Team colors should remain concentrated in headers and meaningful accents; neutral statistical surfaces should remain comparable across teams.

Light mode was not visually verified in the audits. Its current behavior must be established from the application and rendered browser before approving any UI change; do not infer it from dark-mode screenshots. Data-light scheduled games and data-heavy rosters require different density judgments. Live, completed, box-score, and play-by-play states must be checked when available, and otherwise reported as unverified rather than asserted to pass.

## 8. Regression testing checklist

Apply this checklist only to a later approved implementation, selecting the cases affected by that task. Record any unavailable state explicitly.

- [ ] Desktop layout and 390 px and 320 px mobile layouts retain readable content, alignment, and intended horizontal scrolling.
- [ ] Light and dark modes render affected text, surfaces, controls, and focus states legibly; contrast is checked with an appropriate tool rather than estimated from screenshots alone.
- [ ] Denver, Boston, Lakers, and Miami examples retain team identity and readable active states. Include a dense injury case and a team with multiple local broadcasts when relevant.
- [ ] Roster numbers remain aligned; all existing statistics, sorts, filters, player links, and horizontal-scroll behavior remain available.
- [ ] Games list and calendar retain selection, month navigation, expanded matchup information, and the existing selected-game detail panel.
- [ ] Local and national broadcast channels remain distinguishable and all labels remain readable.
- [ ] Player profiles retain exact stat values and game-log access.
- [ ] Scheduled-game details retain all injury names, statuses, and conditions. Live/completed score, box-score, and play-by-play behavior is checked when accessible.
- [ ] Keyboard focus, accessible names, touch targets, zoom/reflow, and screen-reader order are not degraded in affected components.
- [ ] Before/after visual comparison shows no unintended change to shared headers, footer, team picker, unrelated pages, or data-dense states.
- [ ] Existing project checks pass; any failure is reported with its relevance to the change.

## 9. Explicitly rejected recommendations

| Original idea | Decision and reason |
| --- | --- |
| Reduce the prominence of filled local-broadcast pills | **Reject.** Filled local versus outlined national is useful information encoding. The opponent and time remain readable; no scanning failure was shown. Do not alter this styling under this plan. |
| Add a selected-day summary beneath the mobile calendar | **Reject.** Selecting a game already opens a detail panel with matchup, time, channel, preview, records, series, and injuries. Do not duplicate it. |
| Apply a broad injury-card typography increase or stack both teams below 420 px | **Reject as specified.** The concern is limited to very narrow, dense cases; broader changes risk height and comparison. Only VIS-002 may examine a narrower alternative if authorized. |
| Add a permanent roster instruction or fade by default | **Reject as specified.** Discovery failure is unverified, and the proposed treatments can consume space or obscure values. Only VIS-001 may test a smaller cue if authorized. |
| Add photography, decorative textures, pervasive cards, animation, or hide channel details for visual flair | **Reject.** These conflict with the application's lookup and comparison goals. |

## 10. Optional experiments — not authorized for implementation

VIS-001 and VIS-002 are focused usability/visual comparisons; VIS-003 is shelved until a comparison use case exists. None is a production task. Do not create an experimental branch, prototype, or production change solely because these items appear in this document. If an experiment is authorized, record the baseline, use identical content in the candidate, state the trade-offs, and request a separate decision before implementation.

## 11. Open decisions requiring approval

1. Whether to run a small first-time-user study for mobile roster horizontal-scroll discovery (VIS-001).
2. Whether to compare a narrowly scoped injury layout for dense reports at approximately 320–350 px (VIS-002).
3. If either study supports a change, the exact proposed variant, affected breakpoint/content conditions, and promotion to P1 or P2 require explicit approval. No success threshold or implementation design was established by the audits.
4. A player comparison use case and authorization would be needed before exploring VIS-003.

These are decisions for the site owner. Claude Code should report them without choosing on the owner's behalf.

## 12. Instructions for Claude Code

**Current execution status:** There are no approved P1 or P2 tasks. Do not modify the website on the authority of this document alone. Phase 0 may be used to report codebase facts; then stop and identify the approval gates in Section 11. If the owner later supplies an approved P1/P2 task, apply the directive below to that task.

Before making changes, inspect the relevant codebase and validate the assumptions in this specification.

Implement only the approved P1 and P2 tasks, following the documented priorities and dependencies.

Use existing design patterns wherever possible. Preserve functionality, accessibility, responsive behavior, and team-specific theming.

Do not implement rejected recommendations or optional experiments.

If a recommendation conflicts with the existing architecture, requires an unapproved design decision, or creates a meaningful usability trade-off, stop that task and report the issue rather than improvising.

Implement changes in small, verifiable groups. Run available checks and inspect affected pages before proceeding.

At completion, report each task's implementation status, files changed, tests performed, and any outstanding concerns.

## 13. Status updates

- **VIS-002 — done (option B), owner-approved October 2026.** A comparison on identical dense injury
  lists (Lakers–Warriors and Nuggets–Thunder; 320, 350, 390 px and desktop; light and dark) found
  "Day-to-day" breaking at its hyphen across lines in 5 of 13 entries at 320–350 px and 1 at 390 px.
  The fix keeps the status word on one line (`sb-inj-label` in `src/components/GamePage.tsx` and
  `src/App.css`). It removed every split at a cost of 16 px card height at 320–350 px and none at
  390 px or desktop; both teams stay side by side at the same text size with every entry. The
  stacked-status candidate also fixed the splits but cost 62 px at 320 px, so it wasn't used.
- **VIS-001 — closed, no change (owner decision, October 20, 2026).** The sideways-scrolling roster
  table is accepted; a Basic/All stats switch is noted for the player stats pass in
  [HUMAN_REVIEW.md](HUMAN_REVIEW.md), where the unrun test protocol is kept for reference.
- **VIS-003 — closed.** No player-comparison use case is planned.
- **Injury lists over the color blend — done (option 3), owner-approved October 2026.** On the
  game page's matchup card, injury text reaching into the blend in the middle fell below 4.5:1 in
  29% of the 870 matchups on phones (21% on desktop; worst about 2.0:1, Brooklyn vs Memphis).
  Compared on identical content: solid halves behind the lists (passes everywhere but leaves a
  stepped edge beside the desktop time box) and dark panels behind the lists. The owner chose the
  panels: `.sb-injuries:not(.empty)` in `src/App.css`, 66% dark with white text, which keeps
  names at 6.2:1 or better and the dimmed status text at 5.0:1 or better over every team's colors.
  A team with no injuries gets no panel. Trade-off: the panel padding makes the lists a little
  narrower, so a few more lines wrap on 320 px phones.

