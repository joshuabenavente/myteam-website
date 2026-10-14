# Installable app

myteam.fans can be installed to a phone's home screen or a computer's app list. It's the same
site: no app store, and every deploy reaches installed apps.

## How it's built

- **Manifest and icons.** The build (`vite.config.ts`) writes a manifest per team
  (`/<team>/manifest.webmanifest`) and icons in `/icons/`: 192 and 512px on the rounded tile,
  a 512px edge-to-edge "maskable" one for Android, and a 180px one for iPhones. Each team's icon
  has that team's dot (the same color as the logo dot in its header); the team picker and the
  root use the neutral coral dot. Installing from a team's page gives that team's icon, fixed at
  install. The page swaps the manifest and iPhone icon links as you move between teams
  (`setAppIcons` in `src/lib/team.ts`).
- **Opening the app** starts at `/`, which goes to the team you follow.
- **iPhone.** Full screen with the header behind the status bar (`black-translucent`); the
  header, sticky bar and footer pad for the notch and home indicator with `env(safe-area-inset-*)`.
- **Service worker** (`pwa/sw.js`, filled in by the build with that build's file list):
  - pages come from the network, so a new deploy shows on the next open; offline, the copy saved
    last time, or the app shell (`404.html`);
  - scripts, styles and fonts are saved at install, and the old set is dropped on the next deploy;
  - data (`/data/*.json`) comes from the network; offline, the last saved copy, marked with an
    `X-Myteam-Offline` header so the page shows "Offline · showing data from 3:15 PM";
  - other sites (ESPN live scores, team logos) aren't touched, so a live score is never stale.
- **Install prompts.** "Install app" appears in the footer and on the team picker when the
  browser offers installing (Chrome, Edge, Android). iPhone Safari has no install button, so it
  shows a one-line tip instead (Share, then Add to Home Screen). Both disappear once installed.

## Later: notifications

Game starting, final score, and injury news for your team. Web push works on Android and desktop,
and on iPhones (iOS 16.4+) for installed apps. It needs:

1. A server to send pushes: the Cloudflare Worker that starts the hourly data refresh could hold
   subscriptions (in Workers KV) and send them, with VAPID keys kept as Worker secrets.
2. In the app: a "Notify me" switch per team that asks permission only when pressed, and the
   service worker showing the notification and opening the game page when it's tapped.
3. Triggers: the data refresh (or a more frequent Worker cron during games) noticing tip-off,
   final scores and new injury listings for followed teams.
