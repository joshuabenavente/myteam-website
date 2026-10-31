# myteam.fans mobile concept

Open `index.html` from File Explorer in a regular browser such as Chrome or Edge. Codex's in-app browser does not display local `file://` pages. The file now contains its own initial screen and wordmark, so it remains visible even if its script or separate local assets do not load. It does not affect the production app.

For an immediate visual review inside Codex, open `games-preview.png` and `players-preview.png`. These show the four key screens; the HTML file contains the interactions.

`games-logos-preview.png` and `players-logos-preview.png` show a separate visual variant with the app's dark-background team logo assets in the team slots. Player initials remain as player-avatar placeholders.

The interactive `index.html` uses the team logos. Player avatars remain initials placeholders on the roster and individual player screen.

## Explore

- Games → the Warriors matchup → Preview / Box score / Play by play
- Recent results → a final score and Jokić's published game line
- Players → search or switch points between per-game and totals → Jokić → compare with the same point last season or the full prior season

The sample is anchored to the repository's published data from October 25, 2026. It does not request live scores. The wordmark SVG is generated from the exact letter outlines in `src/lib/brand.ts` by `build-wordmark.mjs`.

## Design direction

- One strong next-game moment, short result rows, then deeper details on demand.
- A dark canvas carries the existing myteam.fans navy, gold, custom wordmark, and slowly moving ribbon gradients. The ribbon animation stops with reduced-motion preference.
- Team theme variables are the intended inputs for other teams; this focused preview uses Denver data and colors only.
- Published-data freshness is explicit and separate from live-score refresh. The concept label and snapshot date prevent sample values from looking current.

This prototype demonstrates hierarchy and navigation, not the complete production feature set. Some game data and alternate player details are represented by placeholders.
