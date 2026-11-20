// cover.js — the canvas cover renderer for Vice City Sunset.
//
// It turns a set of photos and a few words into a GTA-style poster cover:
// multi-panel layouts, a sunset or neon grade, a huge chrome title that
// overlaps the panels, and the poster furniture (press strip, starburst
// seal, HEAT pill, retro-sun bottom strip, barcode). Everything is drawn
// on a 2D canvas, so the editor's live preview and the exported PNG are
// the same drawing.
//
// A cover's state is plain data:
//   { layout, grade, size, title, subtitle, tagline,
//     photos: [HTMLImageElement, ...], focus: [{ fx, fy, zoom }, ...] }
// where focus[i] is the crop of photos[i]: fx/fy pick the point of the
// photo that stays centred in its panel (0..1), zoom magnifies it.

export const COVER_VERSION = 'v5-rebuild';

const TITLE_FONT = 'Anton, sans-serif';
const SCRIPT_FONT = 'Pacifico, cursive';
const INK_DARK = '#160a24';
const PLUM_DEEP = '#0a0412';

// ---------------------------------------------------------------- sizes

export const SIZES = {
  wide: { width: 1920, height: 1080, label: 'Wide 1920 × 1080' },
  square: { width: 1080, height: 1080, label: 'Square 1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: 'Story 1080 × 1350' },
};

// ---------------------------------------------------------------- grades

// A grade is a colour wash laid over the panels: a vertical gradient in a
// blend mode, a flat tint, an optional desaturation pass, then vignette
// and grain. The washes are warm sunset, neon, fever, dusk, chrome and
// gold — each a different mood over the same panels.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    swatch: 'linear-gradient(135deg,#ff9a3d,#ff5e7a)',
    top: '#ff9a3d',
    bottom: '#ff5e7a',
    mode: 'overlay',
    wash: 0.2,
    tint: 'rgba(255,110,60,0.06)',
    desat: 0,
  },
  neon: {
    name: 'Neon',
    swatch: 'linear-gradient(135deg,#ff2e88,#2ee6c8)',
    top: '#ff2e88',
    bottom: '#2ee6c8',
    mode: 'soft-light',
    wash: 0.26,
    tint: 'rgba(46,230,200,0.05)',
    desat: 0,
  },
  fever: {
    name: 'Fever',
    swatch: 'linear-gradient(135deg,#ff5e1a,#ff2e88)',
    top: '#ff5e1a',
    bottom: '#ff2e88',
    mode: 'overlay',
    wash: 0.26,
    tint: 'rgba(255,46,136,0.09)',
    desat: 0,
  },
  dusk: {
    name: 'Dusk',
    swatch: 'linear-gradient(135deg,#7b5cff,#1b2a6b)',
    top: '#7b5cff',
    bottom: '#1b2a6b',
    mode: 'overlay',
    wash: 0.24,
    tint: 'rgba(40,20,90,0.12)',
    desat: 0,
  },
  chrome: {
    name: 'Chrome',
    swatch: 'linear-gradient(135deg,#cfd8e3,#5a6b7d)',
    top: '#cfd8e3',
    bottom: '#5a6b7d',
    mode: 'soft-light',
    wash: 0.18,
    tint: 'rgba(180,200,220,0.06)',
    desat: 0.35,
  },
  gold: {
    name: 'Gold',
    swatch: 'linear-gradient(135deg,#ffd76a,#ff8a1a)',
    top: '#ffd76a',
    bottom: '#ff8a1a',
    mode: 'overlay',
    wash: 0.22,
    tint: 'rgba(255,180,60,0.10)',
    desat: 0,
  },
};

// --------------------------------------------------------------- layouts

// Each layout is a function of the canvas size returning panels as
// fractions of it: { x, y, w, h, photo, rotate?, frame? }. The mosaic is
// the default: a cinematic hero on the left, five smaller scenes on the
// right, so six photos fill the whole cover with no dead space.
export const LAYOUTS = {
  mosaic: {
    name: 'Mosaic',
    blurb: 'Hero left, five scenes right',
    panels: (w, h) => [
      { x: 0, y: 0, w: 0.54, h: 1, photo: 0 },
      { x: 0.54, y: 0, w: 0.23, h: 0.34, photo: 1 },
      { x: 0.77, y: 0, w: 0.23, h: 0.34, photo: 2 },
      { x: 0.54, y: 0.34, w: 0.46, h: 0.33, photo: 3 },
      { x: 0.54, y: 0.67, w: 0.23, h: 0.33, photo: 4 },
      { x: 0.77, y: 0.67, w: 0.23, h: 0.33, photo: 5 },
    ],
  },
  grid9: {
    name: 'Grid 9',
    blurb: 'Nine tiles, every photo twice over',
    panels: (w, h) => {
      const out = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          out.push({
            x: col / 3,
            y: row / 3,
            w: 1 / 3,
            h: 1 / 3,
            photo: (row * 3 + col) % 6,
          });
        }
      }
      return out;
    },
  },
  heroThree: {
    name: 'Hero + 3',
    blurb: 'One big face, three moments',
    panels: (w, h) => [
      { x: 0, y: 0, w: 0.62, h: 1, photo: 0 },
      { x: 0.62, y: 0, w: 0.38, h: 0.34, photo: 1 },
      { x: 0.62, y: 0.34, w: 0.38, h: 0.33, photo: 2 },
      { x: 0.62, y: 0.67, w: 0.38, h: 0.33, photo: 3 },
    ],
  },
  duet: {
    name: 'Duet',
    blurb: 'Two leads, side by side',
    panels: (w, h) => [
      { x: 0, y: 0, w: 0.5, h: 1, photo: 0 },
      { x: 0.5, y: 0, w: 0.5, h: 1, photo: 1 },
    ],
  },
  strip: {
    name: 'Strip',
    blurb: 'Wide hero, three below',
    panels: (w, h) => [
      { x: 0, y: 0, w: 1, h: 0.62, photo: 0 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38, photo: 1 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38, photo: 2 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38, photo: 3 },
    ],
  },
  tilt: {
    name: 'Tilt',
    blurb: 'Snapshots pinned at an angle',
    panels: (w, h) => [
      { x: 0.06, y: 0.05, w: 0.58, h: 0.74, photo: 0, rotate: -0.05, frame: true },
      { x: 0.62, y: 0.42, w: 0.33, h: 0.42, photo: 1, rotate: 0.045, frame: true },
      { x: 0.66, y: 0.06, w: 0.28, h: 0.3, photo: 2, rotate: -0.02, frame: true },
    ],
  },
  stack: {
    name: 'Stack',
    blurb: 'Big top, two below — made for stories',
    panels: (w, h) => [
      { x: 0, y: 0, w: 1, h: 0.55, photo: 0 },
      { x: 0, y: 0.55, w: 0.5, h: 0.45, photo: 1 },
      { x: 0.5, y: 0.55, w: 0.5, h: 0.45, photo: 2 },
    ],
  },
};

// Panels as pixel rects for a canvas of W x H, in draw order.
export function layoutPanels(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.mosaic;
  return layout.panels(W, H).map((p) => ({
    x: p.x * W,
    y: p.y * H,
    w: p.w * W,
    h: p.h * H,
    photo: p.photo,
    rotate: p.rotate ?? 0,
    frame: Boolean(p.frame),
  }));
}

// The panel under a point of the canvas (draw order: later panels win),
// or -1 when the point is on no panel.
export function hitPanel(layoutId, W, H, px, py) {
  const panels = layoutPanels(layoutId, W, H);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}

// ---------------------------------------------------------------- helpers

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Draw an image so it covers a rectangle, keeping the focus point centred.
function coverDrawImage(ctx, img, rx, ry, rw, rh, focus) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return false;
  const zoom = focus?.zoom ?? 1;
  const fx = focus?.fx ?? 0.5;
  const fy = focus?.fy ?? 0.5;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const sw = iw * scale;
  const sh = ih * scale;
  const ox = (sw - rw) * fx;
  const oy = (sh - rh) * fy;
  ctx.drawImage(img, rx - ox, ry - oy, sw, sh);
  return true;
}

// A placeholder for a photo that has not loaded yet: a plum gradient with
// its label, so the cover never shows a hole.
function drawPlaceholder(ctx, rx, ry, rw, rh, label) {
  const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  grad.addColorStop(0, '#2a123f');
  grad.addColorStop(1, '#14081f');
  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = 'rgba(245,236,255,0.55)';
  ctx.font = `${Math.max(12, rw * 0.045)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), rx + rw / 2, ry + rh / 2);
}

// ------------------------------------------------------------- the panels

function drawPanel(ctx, W, H, panel, img, focus, label) {
  const gap = Math.max(2, W * 0.003);
  const ix = panel.x + gap / 2;
  const iy = panel.y + gap / 2;
  const iw = panel.w - gap;
  const ih = panel.h - gap;
  ctx.save();
  if (panel.rotate) {
    ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
    ctx.rotate(panel.rotate);
    ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));
  }
  if (panel.frame) {
    // A polaroid frame: white border, thicker at the bottom.
    const fw = Math.max(6, W * 0.008);
    ctx.fillStyle = '#fdf8ef';
    roundRect(ctx, ix - fw, iy - fw, iw + fw * 2, ih + fw * 2.4, fw * 0.6);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = W * 0.012;
    ctx.shadowOffsetY = W * 0.004;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();
  const drawn = img ? coverDrawImage(ctx, img, ix, iy, iw, ih, focus) : false;
  if (!drawn) drawPlaceholder(ctx, ix, iy, iw, ih, label);
  ctx.restore();
  // A thin bright seam around every panel, poster style.
  ctx.save();
  if (panel.rotate) {
    ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
    ctx.rotate(panel.rotate);
    ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1.5, W * 0.0012);
  ctx.strokeRect(ix, iy, iw, ih);
  ctx.restore();
}

function drawPanels(ctx, W, H, state) {
  const panels = layoutPanels(state.layout, W, H);
  for (const panel of panels) {
    const img = state.photos[panel.photo];
    const focus = state.focus?.[panel.photo];
    const label = state.labels?.[panel.photo] ?? `Photo ${panel.photo + 1}`;
    drawPanel(ctx, W, H, panel, img, focus, label);
  }
}

// ----------------------------------------------------------------- grade

function drawGrain(ctx, W, H, seed, strength) {
  const rand = mulberry32(seed);
  const count = Math.floor((W * H) / 1100);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const a = 0.02 + rand() * 0.06 * strength;
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(x, y, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  ctx.restore();
}

function drawGrade(ctx, W, H, grade, state) {
  ctx.save();
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = grade.mode;
  ctx.globalAlpha = grade.wash;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  if (grade.tint) {
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, 0, W, H);
  }
  if (grade.desat > 0) {
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = grade.desat;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  // Vignette: darkened corners pull the eye to the title.
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(8,3,16,0)');
  vig.addColorStop(1, 'rgba(8,3,16,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const seed = hashString(`${state.layout}|${state.grade}|${state.title}`);
  drawGrain(ctx, W, H, seed, 1);
}

// ------------------------------------------------------------------ title

function fitFontSize(ctx, text, family, targetWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  const measured = ctx.measureText(text).width;
  if (measured > 0) size = Math.floor((size * targetWidth) / measured);
  return size;
}

function drawChromeTitle(ctx, W, H, title, subtitle) {
  const text = (title || 'VICE CITY').toUpperCase();
  const targetWidth = W * 0.94;
  let size = fitFontSize(ctx, text, TITLE_FONT, targetWidth, W * 0.2);
  size = Math.min(size, H * 0.32);
  const cy = H * 0.47;
  ctx.save();
  ctx.translate(W / 2, cy);
  ctx.rotate(-0.045);
  ctx.font = `${size}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, '#ffd76a');
  grad.addColorStop(0.62, '#ff7a1a');
  grad.addColorStop(0.85, '#ff2e88');
  grad.addColorStop(1, '#d61f7c');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = Math.max(4, size * 0.085);
  ctx.shadowColor = 'rgba(255,46,136,0.8)';
  ctx.shadowBlur = size * 0.05;
  ctx.shadowOffsetY = size * 0.03;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // The script line under the title, in Pacifico.
  if (subtitle) {
    let subSize = W * 0.042;
    ctx.font = `${subSize}px ${SCRIPT_FONT}`;
    const subWidth = ctx.measureText(subtitle).width;
    if (subWidth > W * 0.62) subSize = Math.floor((subSize * W * 0.62) / subWidth);
    ctx.save();
    ctx.translate(W / 2, H * 0.565);
    ctx.rotate(-0.035);
    ctx.font = `${subSize}px ${SCRIPT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,46,136,0.9)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.shadowOffsetY = subSize * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }
}

// -------------------------------------------------------------- furniture

function drawStar(ctx, cx, cy, rOuter, rInner, points, fill) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawPressStrip(ctx, W, H) {
  // The strip used to size its stars and quote from the strip height, so
  // on tall covers the quote ran past the strip's right edge and over the
  // photo. Now the whole row is measured first and scaled down to fit the
  // strip's width, whatever the cover's shape.
  const stripW = W * 0.46;
  const stripH = Math.min(H * 0.052, W * 0.055);
  const x = W * 0.03;
  const y = H * 0.835;
  const quote = '“A SUN-SOAKED TRIUMPH.”';
  const credit = '— VICE DAILY';
  const pad = stripH * 0.5;
  let starR = stripH * 0.26;
  let fontSize = stripH * 0.36;
  const rowWidth = (fs, sr) => {
    ctx.font = `${fs}px ${TITLE_FONT}`;
    const quoteW = ctx.measureText(quote).width;
    ctx.font = `${fs * 0.82}px ${TITLE_FONT}`;
    const creditW = ctx.measureText(credit).width;
    return pad + sr * 2.4 * 5 + stripH * 0.25 + quoteW + stripH * 0.3 + creditW + pad;
  };
  const total = rowWidth(fontSize, starR);
  if (total > stripW) {
    const scale = stripW / total;
    fontSize *= scale;
    starR *= scale;
  }
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,18,0.78)';
  roundRect(ctx, x, y, stripW, stripH, stripH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,106,0.55)';
  ctx.lineWidth = Math.max(1.5, W * 0.001);
  ctx.stroke();
  const cy = y + stripH / 2;
  let cx = x + pad + starR;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, cx, cy, starR, starR * 0.45, 5, '#ffd76a');
    cx += starR * 2.4;
  }
  cx += stripH * 0.25 - starR;
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px ${TITLE_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(quote, cx, cy);
  const quoteW = ctx.measureText(quote).width;
  ctx.fillStyle = '#ffd76a';
  ctx.font = `${fontSize * 0.82}px ${TITLE_FONT}`;
  ctx.fillText(credit, cx + quoteW + stripH * 0.3, cy);
  ctx.restore();
}

function drawStarburstSeal(ctx, W, H) {
  const cx = W * 0.54;
  const cy = H * 0.34;
  const r = W * 0.038;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.21);
  drawStar(ctx, 0, 0, r, r * 0.82, 14, '#ffd76a');
  ctx.strokeStyle = INK_DARK;
  ctx.lineWidth = Math.max(2, W * 0.0016);
  ctx.stroke();
  ctx.fillStyle = INK_DARK;
  ctx.font = `${Math.max(10, r * 0.42)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('100%', 0, -r * 0.16);
  ctx.fillText('VICE', 0, r * 0.24);
  ctx.restore();
}

function drawHeatPill(ctx, W, H) {
  // The pill is sized from the canvas width, but its content (HEAT plus
  // five stars) used to be sized from the height, so on tall covers the
  // stars ran past the pill and off the canvas. Now the stars are sized
  // from the width that is actually left, capped by the pill height, and
  // the whole row is centred in the pill.
  const pillW = W * 0.17;
  const pillH = Math.min(H * 0.048, W * 0.045);
  const x = W * 0.965 - pillW;
  const y = H * 0.032;
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,18,0.82)';
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,46,136,0.8)';
  ctx.lineWidth = Math.max(1.5, W * 0.001);
  ctx.stroke();
  const pad = pillH * 0.45;
  const fontSize = pillH * 0.38;
  ctx.font = `${fontSize}px ${TITLE_FONT}`;
  const textW = ctx.measureText('HEAT').width;
  const gap = pillH * 0.3;
  const starR = Math.max(
    4,
    Math.min(pillH * 0.26, (pillW - pad * 2 - textW - gap) / (5 * 2.3)),
  );
  const contentW = textW + gap + starR * 2.3 * 4 + starR * 2;
  let cx = x + (pillW - contentW) / 2;
  const cy = y + pillH / 2;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HEAT', cx, cy);
  cx += textW + gap + starR;
  for (let i = 0; i < 5; i++) {
    if (i < 4) drawStar(ctx, cx, cy, starR, starR * 0.45, 5, '#ffd76a');
    else {
      drawStar(ctx, cx, cy, starR, starR * 0.45, 5, 'rgba(255,255,255,0.25)');
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    cx += starR * 2.3;
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s) {
  // A stylised palm silhouette: a leaning trunk and six drooping fronds.
  // It is drawn in deep violet rather than near-black, so it still reads
  // as a silhouette against the strip's dark plum gradient.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#3a1c60';
  ctx.fillStyle = '#3a1c60';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -55, 16, -95);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    const a = (-160 + i * 52) * (Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(16, -95);
    ctx.quadraticCurveTo(
      16 + Math.cos(a) * 34,
      -95 + Math.sin(a) * 30 - 12,
      16 + Math.cos(a) * 58,
      -95 + Math.sin(a) * 34 + 16,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawBottomStrip(ctx, W, H, tagline) {
  const top = H * 0.9;
  ctx.save();
  const grad = ctx.createLinearGradient(0, top, 0, H);
  grad.addColorStop(0, '#1a0b2e');
  grad.addColorStop(1, PLUM_DEEP);
  ctx.fillStyle = grad;
  ctx.fillRect(0, top, W, H - top);
  ctx.fillStyle = 'rgba(255,215,106,0.35)';
  ctx.fillRect(0, top, W, Math.max(2, H * 0.003));

  // Retro sun rising from the bottom edge, sliced by three bars. It is
  // sized generously so its arcs still show around the COMING SOON pill
  // that sits on it, on wide and tall covers alike.
  const sunX = W * 0.5;
  const sunY = H * 0.99;
  const sunR = H * 0.075;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, '#ffd76a');
  sunGrad.addColorStop(0.55, '#ff7a1a');
  sunGrad.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = '#1a0b2e';
  for (let i = 0; i < 3; i++) {
    const by = sunY - sunR * 0.1 + i * sunR * 0.34;
    ctx.fillRect(sunX - sunR, by, sunR * 2, sunR * 0.09);
  }
  ctx.restore();

  // Palms at both ends of the strip.
  drawPalm(ctx, W * 0.055, H * 0.995, (H * 0.085) / 100);
  drawPalm(ctx, W * 0.945, H * 0.995, (H * 0.075) / 100);

  // Tagline above the sun, COMING SOON pill below it.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tagSize = Math.max(11, W * 0.02);
  ctx.font = `${tagSize}px ${TITLE_FONT}`;
  try {
    ctx.letterSpacing = `${Math.max(2, W * 0.004)}px`;
  } catch {
    // letterSpacing is a newer canvas property; the strip reads fine without it.
  }
  ctx.fillStyle = '#ffd76a';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = tagSize * 0.3;
  ctx.fillText((tagline || 'LEONIDA • SUNSHINE STATE').toUpperCase(), W / 2, H * 0.928);
  try {
    ctx.letterSpacing = '0px';
  } catch {
    // ignore
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  const pillW = W * 0.11;
  const pillH = H * 0.032;
  const px = W / 2 - pillW / 2;
  const py = H * 0.962;
  ctx.fillStyle = '#ff2e88';
  roundRect(ctx, px, py, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(10, pillH * 0.42)}px ${TITLE_FONT}`;
  ctx.fillText('COMING SOON', W / 2, py + pillH / 2);
  ctx.restore();
}

function drawVcChip(ctx, W, H) {
  const chip = W * 0.042;
  const x = W * 0.025;
  const y = H * 0.028;
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,18,0.72)';
  roundRect(ctx, x, y, chip, chip, chip * 0.22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,106,0.7)';
  ctx.lineWidth = Math.max(1.5, W * 0.001);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.font = `${chip * 0.42}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VC', x + chip / 2, y + chip / 2 + chip * 0.03);
  ctx.restore();
}

function drawCreditsAndBarcode(ctx, W, H) {
  const y = H * 0.975;
  ctx.save();
  ctx.fillStyle = 'rgba(245,236,255,0.6)';
  ctx.font = `${Math.max(9, W * 0.009)}px ${TITLE_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MADE WITH VICE CITY SUNSET', W * 0.13, y);
  // Barcode: seeded bars, like a price sticker on a poster.
  const rand = mulberry32(20261120);
  const barX = W * 0.9;
  const barW = W * 0.055;
  let bx = barX;
  ctx.fillStyle = 'rgba(245,236,255,0.85)';
  while (bx < barX + barW) {
    const bw = (1 + Math.floor(rand() * 4)) * Math.max(1, W * 0.0012);
    if (rand() > 0.35) ctx.fillRect(bx, y - H * 0.014, bw, H * 0.028);
    bx += bw + Math.max(1, W * 0.0012);
  }
  ctx.restore();
}

function drawFurniture(ctx, W, H, state) {
  drawVcChip(ctx, W, H);
  drawHeatPill(ctx, W, H);
  drawPressStrip(ctx, W, H);
  drawStarburstSeal(ctx, W, H);
  drawBottomStrip(ctx, W, H, state.tagline);
  drawCreditsAndBarcode(ctx, W, H);
}

// -------------------------------------------------------------- the entry

// Draw the whole cover onto a canvas and size the canvas to the chosen
// export size. Returns the pixel size used.
export function renderCover(canvas, state) {
  const size = SIZES[state.size] ?? SIZES.wide;
  const grade = GRADES[state.grade] ?? GRADES.fever;
  const W = size.width;
  const H = size.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, W, H);
  drawPanels(ctx, W, H, state);
  drawGrade(ctx, W, H, grade, state);
  drawChromeTitle(ctx, W, H, state.title, state.subtitle);
  drawFurniture(ctx, W, H, state);
  return { width: W, height: H };
}
