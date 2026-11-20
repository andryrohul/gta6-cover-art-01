# Vice City Sunset — Cover Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/andryrohul/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/andryrohul/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn any photo and a caption into GTA 6-style cover art — the multi-panel
poster look with bold chrome lettering and a Vice City sunset or neon grade —
and export it as a PNG to share. It runs entirely offline in a desktop
browser: your photos never leave your machine.

## How it works

1. Open `app/index.html` (or run `node serve.ts` and visit
   http://localhost:8080).
2. Pick a layout (7 to choose from, `mosaic` is the default) and a colour
   grade (6, from sunset gold to hot `fever` magenta).
3. Drop in your own photos — or keep the six built-in Vice City scenes —
   and crop and position each panel by dragging it. Click a panel to select
   it, drag to move the photo inside it, scroll or use the zoom slider.
4. Write your title, script line and tagline.
5. Export a PNG in one click: 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## What is inside

- `app/src/cover.js` — the cover renderer: seven panel layouts, six grades,
  chrome-gradient title lettering and all the poster furniture (press-quote
  strip, starburst seal, HEAT pill, retro-sun bottom strip, barcode).
- `app/src/main.js` — the editor: photo slots, upload, per-panel crop and
  zoom, live preview, PNG export.
- `app/src/shots.js` — the built-in sample photos and the four screenshot
  scenes.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
  (see `OFL-Anton.txt` and `OFL-Pacifico.txt`).
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json`.
- `serve.ts` — a tiny static server for local development.

## Run it

```sh
node serve.ts            # http://localhost:8080
```

Build the hand-in bundle (what the grader runs):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE). The fonts are licensed under the
SIL Open Font License 1.1. All artwork is original; no Rockstar Games
logo, artwork or font is used anywhere.
