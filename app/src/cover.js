// Vice City Sunset cover engine (v2): draws a multi-panel poster cover onto any
// 2D canvas. Every visual is drawn in code — sunset sky, sun, skyline, palm
// silhouettes, chrome title, starburst badge, quote strip, bottom tagline strip,
// grain and vignette — so the art is original and needs no image assets. Photos
// are the user's own; the engine only ever draws them on the local machine.
// v2: the title is chrome and overlaps the photos (no dead band below them),
// the default layout is a dense 6-panel Mosaic, and the cover carries poster
// furniture: a press-quote strip, a starburst badge, a HEAT pill, a palm-and-sun
// tagline strip and a micro credits line.

export const LAYOUTS = [
  { id: 'mosaic', name: 'Mosaic 6-Panel', panels: 6, blurb: 'Hero + five scenes, poster style' },
  { id: 'hero', name: 'Hero 4-Panel', panels: 4, blurb: 'Big hero + three stacked' },
  { id: 'grid9', name: 'Nine Grid', panels: 9, blurb: '3 x 3 poster grid' },
  { id: 'fullbleed', name: 'Full Bleed', panels: 1, blurb: 'One photo, edge to edge' },
  { id: 'tilted', name: 'Tilted Snaps', panels: 3, blurb: 'Overlapping snapshots' },
  { id: 'duo', name: 'Split Duo', panels: 2, blurb: 'Two photos side by side' },
  { id: 'triptych', name: 'Triptych', panels: 3, blurb: 'Wide centre, two wings' },
];

export const GRADES = [
  { id: 'vice', name: 'Vice Sunset', sky: ['#2b1055', '#ff5e78', '#ff9e57'], tint: 'vice' },
  { id: 'neon', name: 'Neon Nights', sky: ['#0d0221', '#ff2e88', '#00e5ff'], tint: 'neon' },
  { id: 'golden', name: 'Golden Hour', sky: ['#3a1c00', '#ff8c42', '#ffd166'], tint: 'golden' },
  { id: 'noir', name: 'Palm Noir', sky: ['#06121f', '#123a5c', '#2ec4b6'], tint: 'noir' },
  { id: 'bubblegum', name: 'Bubblegum', sky: ['#3d0c4e', '#ff70a6', '#ffd670'], tint: 'bubblegum' },
  { id: 'fever', name: 'Fever Dream', sky: ['#2a0a4a', '#ff2e88', '#ffb347'], tint: 'fever' },
];

/** The six free sample photos (app/samples/), in photo-slot order. */
export const SAMPLES = ['boulevard', 'pier', 'street', 'portrait', 'highway', 'gasstation'];

export const PRESETS = [
  { title: 'VICE CITY', subtitle: 'Sunset Heist' },
  { title: 'NEON SHORE', subtitle: 'Night Shift' },
  { title: 'PIER PRESSURE', subtitle: 'Golden Hour' },
  { title: 'BOULEVARD', subtitle: 'Queen of the Coast' },
  { title: 'PALM ROYALE', subtitle: 'Vice Nights' },
];

export const TITLE_COLORS = ['#ffffff', '#ffd166', '#ff5e78', '#00e5ff', '#c8f169'];

/** A fresh default state: samples preloaded by the editor, Mosaic layout, Vice grade. */
export function defaultState() {
  return {
    layout: 'mosaic',
    grade: 'vice',
    title: 'VICE CITY',
    subtitle: 'Sunset Heist',
    titleColor: '#ffffff',
    photos: [null, null, null, null, null, null],
    // Mosaic panels, each a different scene: hero boulevard, neon portrait,
    // coastal highway, neon gas station, pier, convertible street.
    panelPhoto: [0, 3, 4, 5, 1, 2, 0, 3, 4],
    // Crops are per panel slot: the portrait and pier faces get a top bias so
    // they survive their panels; the hero stays centred (its face is high).
    crops: [
      { ox: 0, oy: 0, zoom: 1 },
      { ox: 0, oy: -0.2, zoom: 1 },
      { ox: 0, oy: 0, zoom: 1 },
      { ox: 0, oy: -0.15, zoom: 1 },
      { ox: 0, oy: -0.3, zoom: 1 },
      { ox: 0, oy: 0, zoom: 1 },
      { ox: 0, oy: -0.45, zoom: 1 },
      { ox: 0, oy: -0.45, zoom: 1 },
      { ox: 0, oy: -0.45, zoom: 1 },
    ],
    showPalms: true,
    showBadge: true,
    grain: true,
  };
}

/** Panel rectangles (fractions of the cover) for a layout, plus rotations. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(2, Math.round(w * 0.005));
  const px = (fx, fy, fw, fh, rot = 0) => ({
    x: fx * w + (fx > 0 ? g / 2 : 0),
    y: fy * h + (fy > 0 ? g / 2 : 0),
    w: fw * w - (fx > 0 ? g / 2 : 0) - (fx + fw < 1 ? g / 2 : 0),
    h: fh * h - (fy > 0 ? g / 2 : 0) - (fy + fh < 1 ? g / 2 : 0),
    rot,
  });
  switch (layout) {
    case 'mosaic': return [
      px(0, 0, 0.54, 1),
      px(0.54, 0, 0.23, 0.33),
      px(0.77, 0, 0.23, 0.33),
      px(0.54, 0.33, 0.46, 0.27),
      px(0.54, 0.60, 0.23, 0.40),
      px(0.77, 0.60, 0.23, 0.40),
    ];
    case 'grid9': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(px(c / 3, r / 3, 1 / 3, 1 / 3));
      return out;
    }
    case 'fullbleed': return [px(0, 0, 1, 1)];
    case 'tilted': return [
      px(0.02, 0.10, 0.44, 0.78, -0.09),
      px(0.30, 0.02, 0.46, 0.84, 0.03),
      px(0.56, 0.09, 0.42, 0.78, 0.10),
    ];
    case 'duo': return [px(0, 0, 0.5, 1), px(0.5, 0, 0.5, 1)];
    case 'triptych': return [px(0, 0, 0.25, 1), px(0.25, 0, 0.5, 1), px(0.75, 0, 0.25, 1)];
    case 'hero':
    default: return [
      px(0, 0, 0.615, 1),
      px(0.615, 0, 0.385, 1 / 3),
      px(0.615, 1 / 3, 0.385, 1 / 3),
      px(0.615, 2 / 3, 0.385, 1 / 3),
    ];
  }
}

function gradeDef(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

/** Paints the sunset sky, sun disc and skyline silhouette behind the panels. */
export function drawSky(ctx, w, h, gradeId) {
  const g = gradeDef(gradeId);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, g.sky[0]);
  sky.addColorStop(0.55, g.sky[1]);
  sky.addColorStop(1, g.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sx = w * 0.5;
  const sy = h * 0.30;
  const sr = w * 0.15;
  const sun = ctx.createRadialGradient(sx, sy, sr * 0.1, sx, sy, sr);
  sun.addColorStop(0, 'rgba(255,246,200,0.98)');
  sun.addColorStop(0.45, 'rgba(255,190,90,0.85)');
  sun.addColorStop(1, 'rgba(255,120,90,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  // Skyline silhouette along the bottom of the sky.
  ctx.fillStyle = 'rgba(24,6,40,0.85)';
  const base = h;
  let x = 0;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w) {
    const bw = w * (0.05 + rnd() * 0.07);
    const bh = h * (0.10 + rnd() * 0.22);
    ctx.fillRect(x, base - bh, bw, bh);
    // A few lit windows.
    ctx.fillStyle = 'rgba(255,210,110,0.75)';
    for (let k = 0; k < 3; k++) {
      if (rnd() > 0.5) ctx.fillRect(x + bw * (0.2 + rnd() * 0.6), base - bh + h * 0.03 + rnd() * bh * 0.6, 3, 4);
    }
    ctx.fillStyle = 'rgba(24,6,40,0.85)';
    x += bw + 2;
  }
}

/** One palm silhouette: curved trunk, seven drooping fronds, coconut cluster. */
export function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  // Trunk: slim and curved, so it reads as a palm and not a pole.
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * s * 0.25, -s * 0.55, lean * s * 0.5, -s * 0.92);
  ctx.stroke();
  const tx = lean * s * 0.5;
  const ty = -s * 0.92;
  // Fronds fan out from the crown.
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (1.08 + (i / 6) * 0.84);
    const len = s * (0.42 + (i % 2) * 0.10);
    const tipX = tx + Math.cos(a) * len;
    const tipY = ty + Math.sin(a) * len * 0.62 + s * 0.16;
    const midX = tx + Math.cos(a) * len * 0.55;
    const midY = ty + Math.sin(a) * len * 0.28 - s * 0.10;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + Math.cos(a + 0.5) * len * 0.28, midY + s * 0.10, tx, ty);
    ctx.fill();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(tx - s * 0.03, ty + s * 0.03, s * 0.035, 0, Math.PI * 2);
  ctx.arc(tx + s * 0.04, ty + s * 0.05, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Cover-fit draw of one photo into a panel rect, with pan/zoom crop. */
export function drawPhotoInto(ctx, img, rect, crop) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const zoom = Math.max(1, crop.zoom || 1);
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  const maxOx = Math.max(0, (pw - rect.w) / 2);
  const maxOy = Math.max(0, (ph - rect.h) / 2);
  const dx = rect.x + (rect.w - pw) / 2 - (crop.ox || 0) * maxOx;
  const dy = rect.y + (rect.h - ph) / 2 - (crop.oy || 0) * maxOy;
  ctx.drawImage(img, dx, dy, pw, ph);
}

/** Placeholder fill for an empty panel: sunset stripes + a plus mark. */
export function drawEmptyPanel(ctx, rect, gradeId) {
  const g = gradeDef(gradeId);
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, g.sky[1]);
  grad.addColorStop(1, g.sky[0]);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, rect.w * 0.012);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = Math.min(rect.w, rect.h) * 0.14;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
  ctx.stroke();
}

/** Colour grade over a rect: tint + light, per grade. */
export function applyGrade(ctx, rect, gradeId) {
  const { x, y, w, h } = rect;
  ctx.save();
  if (gradeId === 'vice') {
    const t = ctx.createLinearGradient(0, y, 0, y + h);
    t.addColorStop(0, 'rgba(255,94,120,0.10)');
    t.addColorStop(0.6, 'rgba(255,140,60,0.16)');
    t.addColorStop(1, 'rgba(255,60,140,0.30)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = t;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const b = ctx.createLinearGradient(0, y + h * 0.6, 0, y + h);
    b.addColorStop(0, 'rgba(0,180,180,0)');
    b.addColorStop(1, 'rgba(0,120,140,0.20)');
    ctx.fillStyle = b;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'neon') {
    const t = ctx.createLinearGradient(0, y, 0, y + h);
    t.addColorStop(0, 'rgba(255,46,136,0.22)');
    t.addColorStop(1, 'rgba(0,229,255,0.22)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = t;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (gradeId === 'golden') {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255,150,50,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const t = ctx.createLinearGradient(0, y, 0, y + h);
    t.addColorStop(0, 'rgba(255,220,120,0.10)');
    t.addColorStop(1, 'rgba(180,60,0,0.22)');
    ctx.fillStyle = t;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(128,128,128,1)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(20,80,110,0.35)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,220,160,0.12)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (gradeId === 'fever') {
    // Hot magenta wash from the top, warm amber lift from the bottom.
    const t = ctx.createLinearGradient(0, y, 0, y + h);
    t.addColorStop(0, 'rgba(255,46,136,0.26)');
    t.addColorStop(0.55, 'rgba(255,120,80,0.10)');
    t.addColorStop(1, 'rgba(255,179,71,0.20)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = t;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else { // bubblegum
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255,112,166,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const leak = ctx.createRadialGradient(x, y, 0, x, y, w * 0.7);
    leak.addColorStop(0, 'rgba(255,255,255,0.28)');
    leak.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = leak;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

let noisePattern = null;
/** Film grain + vignette over the whole cover. */
export function finishCover(ctx, w, h, grainOn) {
  if (grainOn) {
    if (!noisePattern) {
      const n = document.createElement('canvas');
      n.width = 128; n.height = 128;
      const nctx = n.getContext('2d');
      const img = nctx.createImageData(128, 128);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 110 + Math.floor(Math.random() * 90);
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      nctx.putImageData(img, 0, 0);
      noisePattern = ctx.createPattern(n, 'repeat');
    }
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = noisePattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,0,20,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** Halftone dots fading down from a band's top edge. */
function drawHalftone(ctx, x, y, w, rows, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = 14;
  for (let r = 0; r < rows; r++) {
    for (let cx = x + step / 2; cx < x + w; cx += step) {
      const rr = Math.max(0.6, 3.2 - r * 0.9);
      ctx.globalAlpha = Math.max(0.05, 0.30 - r * 0.09);
      ctx.beginPath();
      ctx.arc(cx + (r % 2 ? step / 2 : 0), y + r * step + 6, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Fits one line of text to a width, returns the font size used. */
function fitFont(ctx, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** A spiky starburst seal: gradient fill, dark outline, three lines of text. */
function drawStarburst(ctx, cx, cy, r, lines) {
  ctx.save();
  ctx.translate(cx, cy);
  const spikes = 16;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.82;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const fill = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
  fill.addColorStop(0, '#ffe9a8');
  fill.addColorStop(0.55, '#ff9e57');
  fill.addColorStop(1, '#ff2e88');
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,3,38,0.9)';
  ctx.lineWidth = Math.max(2, r * 0.04);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1c0a33';
  const [top, mid, bot] = lines;
  const topSize = fitFont(ctx, top, r * 1.1, r * 0.30, 'Anton, "Arial Black", sans-serif');
  ctx.font = `${topSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillText(top, 0, -r * 0.42);
  const midSize = fitFont(ctx, mid, r * 1.25, r * 0.34, 'Anton, "Arial Black", sans-serif');
  ctx.font = `${midSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillText(mid, 0, -r * 0.02);
  const botSize = fitFont(ctx, bot, r * 1.25, r * 0.30, 'Anton, "Arial Black", sans-serif');
  ctx.font = `${botSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillText(bot, 0, r * 0.38);
  ctx.restore();
}

/** The chrome title: slanted, magenta drop shadow, dark outline, gradient fill. */
export function drawChromeTitle(ctx, W, H, state) {
  const g = gradeDef(state.grade);
  const title = (state.title || 'VICE CITY').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const cx = W / 2;
  const titleY = H * 0.665;
  ctx.save();
  ctx.translate(cx, titleY);
  ctx.rotate(-0.045);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, title, W * 0.94, H * 0.29, 'Anton, "Arial Black", sans-serif');
  // Hard magenta drop shadow, offset down-right.
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  ctx.fillStyle = '#8f0f56';
  ctx.fillText(title, size * 0.045, size * 0.06);
  // Thick dark outline, then the chrome gradient fill.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,3,38,0.95)';
  ctx.lineWidth = Math.max(2, size * 0.11);
  ctx.strokeText(title, 0, 0);
  const chrome = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  chrome.addColorStop(0, state.titleColor || '#ffffff');
  chrome.addColorStop(0.30, '#fff6c8');
  chrome.addColorStop(0.52, '#ffd166');
  chrome.addColorStop(0.72, '#ff9e57');
  chrome.addColorStop(1, '#ff2e88');
  ctx.fillStyle = chrome;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  if (sub) {
    // Script subtitle overlapping the title's lower edge, right of centre.
    ctx.save();
    ctx.translate(cx + W * 0.11, titleY + size * 0.48);
    ctx.rotate(-0.05);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subSize = fitFont(ctx, sub, W * 0.50, size * 0.42, 'Pacifico, cursive');
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,3,38,0.85)';
    ctx.lineWidth = Math.max(2, subSize * 0.08);
    ctx.strokeText(sub, 0, 0);
    ctx.fillStyle = g.sky[2];
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
  return { size, titleY };
}

/** All poster furniture: scrim, quote strip, starburst, HEAT pill, chrome title,
 *  bottom tagline strip and micro credits line. Drawn over the photo panels. */
export function drawPosterFurniture(ctx, W, H, state) {
  const g = gradeDef(state.grade);
  // Dark scrim behind the title zone so the lettering reads over bright photos.
  const scrim = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.90);
  scrim.addColorStop(0, 'rgba(10,0,20,0)');
  scrim.addColorStop(0.38, 'rgba(10,0,20,0.30)');
  scrim.addColorStop(1, 'rgba(10,0,20,0.50)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.42, W, H * 0.48);
  // Press-quote strip, just above the title: gold stars + an original quote.
  const quote = '“A POSTCARD FROM THE EDGE” — VICE CITY GAZETTE';
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const qSize = fitFont(ctx, quote, W * 0.40, H * 0.032, 'Anton, "Arial Black", sans-serif');
  ctx.font = `${qSize}px Anton, "Arial Black", sans-serif`;
  const stars = '★★★★★ ';
  const starsW = ctx.measureText(stars).width;
  const textW = ctx.measureText(quote).width;
  const stripH = qSize * 2.2;
  const stripY = H * 0.485 - stripH / 2;
  const stripW = starsW + textW + qSize * 1.6;
  const stripX = W * 0.03;
  ctx.fillStyle = 'rgba(13,2,24,0.78)';
  ctx.beginPath();
  ctx.roundRect(stripX, stripY, stripW, stripH, stripH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillText(stars, stripX + qSize * 0.8, H * 0.485);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(quote, stripX + qSize * 0.8 + starsW, H * 0.485);
  ctx.restore();
  if (state.showBadge) {
    // Starburst seal at the panel junction, and the HEAT pill top-right.
    drawStarburst(ctx, W * 0.615, H * 0.36, W * 0.082, ['★★★', 'ORIGINAL', 'COVER ART']);
    ctx.save();
    ctx.translate(W * 0.925, H * 0.045);
    ctx.rotate(-0.07);
    const bw = W * 0.14;
    const bh = H * 0.05;
    const pill = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    pill.addColorStop(0, '#ff2e88');
    pill.addColorStop(1, '#ff9e57');
    ctx.fillStyle = pill;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pillSize = fitFont(ctx, '★★★★★ HEAT', bw * 0.86, bh * 0.52, 'Anton, "Arial Black", sans-serif');
    ctx.font = `${pillSize}px Anton, "Arial Black", sans-serif`;
    ctx.fillText('★★★★★ HEAT', 0, 1);
    ctx.restore();
  }
  drawChromeTitle(ctx, W, H, state);
  // Bottom strip: gold rule, halftone, striped sun, palm silhouettes, tagline.
  const y0 = H * 0.885;
  const y1 = H * 0.955;
  const strip = ctx.createLinearGradient(0, y0, 0, y1);
  strip.addColorStop(0, '#160826');
  strip.addColorStop(1, g.sky[1]);
  ctx.fillStyle = strip;
  ctx.fillRect(0, y0, W, y1 - y0);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, y0, W, Math.max(2, H * 0.004));
  drawHalftone(ctx, 0, y0 + (y1 - y0) * 0.06, W, 1, g.sky[2]);
  // Retro striped sun, left of the tagline: solid on top, slits widening down.
  const sunX = W * 0.075;
  const sunY = (y0 + y1) / 2 - (y1 - y0) * 0.06;
  const sunR = (y1 - y0) * 0.46;
  ctx.save();
  const sunFill = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  sunFill.addColorStop(0, '#fff6c8');
  sunFill.addColorStop(1, '#ff9e57');
  ctx.fillStyle = sunFill;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#160826';
  for (let i = 0; i < 3; i++) {
    const sy = sunY + sunR * (0.08 + i * 0.32);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, Math.max(1, sunR * (0.07 + i * 0.05)));
  }
  ctx.restore();
  if (state.showPalms) {
    const s = (y1 - y0) * 0.85;
    ctx.save();
    ctx.globalAlpha = 0.92;
    drawPalm(ctx, W * 0.155, y1 - 2, s, 0.35, 'rgba(12,2,24,0.95)');
    drawPalm(ctx, W * 0.845, y1 - 2, s * 0.9, -0.4, 'rgba(12,2,24,0.95)');
    drawPalm(ctx, W * 0.925, y1 - 2, s * 0.75, 0.3, 'rgba(12,2,24,0.95)');
    ctx.restore();
  }
  // Tagline, centred between the sun and the palms.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '2px'; } catch { /* older canvas: no letter spacing */ }
  const tag = 'LEONIDA • TWO CITIES • ONE SUNSET • COMING SOON';
  const tagSize = fitFont(ctx, tag, W * 0.52, H * 0.030, 'Anton, "Arial Black", sans-serif');
  ctx.font = `${tagSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tag, W * 0.50, (y0 + y1) / 2);
  try { ctx.letterSpacing = '0px'; } catch { /* reset for later draws */ }
  ctx.restore();
  // Micro credits line, VC chip and barcode along the very bottom.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const cred = 'VICE CITY — A SUNSET HEIST POSTER • STARRING YOU • SHOT ON YOUR OWN CAMERA • GRADED BY HAND';
  const credSize = fitFont(ctx, cred, W * 0.86, H * 0.016, 'system-ui, sans-serif');
  ctx.font = `${credSize}px system-ui, sans-serif`;
  ctx.fillText(cred, W * 0.50, H * 0.978);
  ctx.fillStyle = '#ff2e88';
  const chip = H * 0.028;
  ctx.beginPath();
  ctx.roundRect(W * 0.012, H * 0.978 - chip / 2, chip, chip, chip * 0.2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(chip * 0.55)}px Anton, "Arial Black", sans-serif`;
  ctx.fillText('VC', W * 0.012 + chip / 2, H * 0.978 + 1);
  const barW = W * 0.038;
  const barH = H * 0.030;
  const barX = W * 0.955;
  const barY = H * 0.978 - barH / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#111111';
  let bx = barX + 2;
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (bx < barX + barW - 3) {
    const bw = 1 + rnd() * 3;
    if (rnd() > 0.45) ctx.fillRect(bx, barY + 2, bw, barH - 4);
    bx += bw + 1 + rnd() * 2;
  }
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (any size) from `state`.
 * Photos are HTMLImageElements (or null); crops are per panel slot.
 * Panels fill the whole cover; the chrome title and poster furniture overlap them.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx, W, H, state.grade);
  const panels = layoutPanels(state.layout, W, H);
  const frame = state.layout === 'tilted';
  panels.forEach((p, i) => {
    ctx.save();
    if (p.rot) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.translate(-p.w / 2, -p.h / 2);
      // Snapshot frame: white border + bottom strip.
      ctx.fillStyle = '#fdf8ef';
      ctx.fillRect(-p.w * 0.03, -p.h * 0.03, p.w * 1.06, p.h * 1.10);
      ctx.beginPath();
      ctx.rect(0, 0, p.w, p.h);
      ctx.clip();
    } else {
      // Shift the context to the panel's own origin so the photo, the empty
      // fill and the grade all draw in panel-local coordinates.
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.rect(0, 0, p.w, p.h);
      ctx.clip();
    }
    const photo = state.photos[state.panelPhoto[i] ?? 0] || null;
    if (photo) drawPhotoInto(ctx, photo, { x: 0, y: 0, w: p.w, h: p.h }, state.crops[i] || { ox: 0, oy: 0, zoom: 1 });
    else drawEmptyPanel(ctx, { x: 0, y: 0, w: p.w, h: p.h }, state.grade);
    applyGrade(ctx, { x: 0, y: 0, w: p.w, h: p.h }, state.grade);
    ctx.restore();
    if (frame) {
      // Handwritten caption strip on the snapshot frame.
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#2b1a12';
      ctx.font = `${Math.round(p.w * 0.055)}px Pacifico, cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(state.subtitle || 'Vice Nights', 0, p.h * 0.53);
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(2, W * 0.003);
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  });
  drawPosterFurniture(ctx, W, H, state);
  finishCover(ctx, W, H, state.grain);
}

/** Renders the cover at export size on a fresh canvas. */
export function exportCoverCanvas(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
