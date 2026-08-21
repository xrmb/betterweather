# betterweather

## Verification

- `npm test` launches a headless Playwright browser, loads a weather.com radar page, injects both userscripts, and prints a JSON summary plus a screenshot under `snapshots/`.
- `npm run capture` saves the current page as HAR, full HTML, and screenshot under `snapshots/`.

## Diagnostic scripts

Run from the repo root. Each script accepts an optional HTML snapshot path; otherwise it uses the latest `snapshots/radar-*.html`.

- `node scripts/find-controls.js [snapshot]` — locate map control buttons by `aria-label`.
- `node scripts/find-leftnav.js [snapshot]` — locate left navigation labels.
- `node scripts/inspect-snapshot.js [snapshot]` — list map menu items with thumbnail URLs.

## Userscripts

- `hide-sidebar.user.js` — hides the right-side promotions / ad aside on the weather.com interactive radar page.
- `maps-sidebar.user.js` — builds a circular icon sidebar for the map layer selector on the interactive radar page. It relies on the toolbar `role="toolbar"[aria-label="Map layer selector"]` and the thumbnail grid `span.rounded-full.bg-cover.bg-center`.

## Notes

- The weather.com map menu changes periodically. When it does, `maps-sidebar.user.js` needs its `labelToMap`, `classicMaps`, and `imgname` maps updated for any new free map layers.
