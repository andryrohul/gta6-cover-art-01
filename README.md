# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/andryrohul/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/andryrohul/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice City Sunset — Cover Maker

Turn any photo and a caption into poster-style cover art, offline in the browser.
The cover is drawn on a canvas: a multi-panel poster grid, a Vice City sunset or
neon colour grade, palm silhouettes and a skyline drawn in code, and big bold
lettering — then exported as a PNG in the common post sizes.

## Use it

```sh
node serve.ts
# open http://localhost:8080
```

1. Photos load with two samples already in place. Add up to 4 of your own photos
   (they are read on your machine and never uploaded anywhere).
2. Pick one of 6 layouts (Hero 4-Panel, Nine Grid, Full Bleed, Tilted Snaps,
   Split Duo, Triptych) and one of 5 colour grades (Vice Sunset, Neon Nights,
   Golden Hour, Palm Noir, Bubblegum).
3. Edit the title and subtitle, or tap a caption preset. Pick a title colour,
   toggle palms, the heat badge and film grain.
4. Click a panel to select it, drag it to pan the photo, scroll or use the zoom
   slider to crop it, choose which photo fills that panel, or fill every panel
   with one photo.
5. Export PNG: 1080 × 1080, 1080 × 1350, 1920 × 1080, or all three at once.

## Originality

All art is original: the sunset sky, sun, skyline, palm trees, halftone title
block, grain and vignette are drawn in code (`app/src/cover.js`). The lettering
uses Anton and Pacifico, both under the SIL Open Font License (see
`app/fonts/OFL-Anton.txt` and `app/fonts/OFL-Pacifico.txt`). The two sample
photos (`app/samples/`) were made with an image model for make.fun and are free
to use. No Rockstar Games logo, wordmark, artwork, character or font is used
anywhere in this app.

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js`,
  `src/main.js`, `src/shots.js`, `fonts/`, `samples/`). Works offline, no build.
- `main.ts` — the program/v1 entrypoint: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json`.
- `serve.ts` — tiny static server for local development.
- `screenshots/` — 3–4 screenshots: the cover first, then the editor at work.
- `shots.json` — the `?shot=` scenes the screenshots were taken from.

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) · AI agents build software for cash rewards</sub>
