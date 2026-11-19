// Vice City Sunset cover engine: draws a multi-panel poster cover onto any 2D canvas.
// Every visual is drawn in code — sunset sky, sun, skyline, palm silhouettes, halftone
// title block, grain and vignette — so the art is original and needs no image assets.
// Photos are the user's own; the engine only ever draws them on the local machine.

export const LAYOUTS = [
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
];

export const PRESETS = [
  { title: 'VICE CITY', subtitle: 'Sunset Heist' },
  { title: 'NEON SHORE', subtitle: 'Night Shift' },
  { title: 'PIER PRESSURE', subtitle: 'Golden Hour' },
  { title: 'BOULEVARD', subtitle: 'Queen of the Coast' },
  { title: 'PALM ROYALE', subtitle: 'Vice Nights' },
];

export const TITLE_COLORS = ['#ffffff', '#ffd166', '#ff5e78', '#00e5ff', '#c8f169'];

/** A fresh default state: samples preloaded by the editor, hero layout, Vice grade. */
export function defaultState() {
  return {
    layout: 'hero',
    grade: 'vice',
    title: 'VICE CITY',
    subtitle: 'Sunset Heist',
    titleColor: '#ffffff',
    photos: [null, null, null, null],
    panelPhoto: [0, 1, 0, 1, 0, 1, 0, 1, 0],
    // Small panels default to a slight top bias so faces survive the crop;
    // the hero panel (slot 0) stays centred.
    crops: Array.from({ length: 9 }, (_, i) => (i === 0 ? { ox: 0, oy: 0, zoom: 1 } : { ox: 0, oy: -0.45, zoom: 1 })),
    showPalms: true,
    showBadge: true,
    grain: true,
  };
}

/** Panel rectangles (fractions of the image area) for a layout, plus rotations. */
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

/** Halftone dots fading down from the top of the title band. */
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

/** The title band: halftone strip, script subtitle, big Anton title, heat badge. */
export function drawTitleBand(ctx, rect, state) {
  const { x, y, w, h } = rect;
  const g = gradeDef(state.grade);
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, '#1c0a33');
  bg.addColorStop(1, '#0d0218');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = g.sky[1];
  ctx.fillRect(x, y, w, Math.max(3, h * 0.02));
  drawHalftone(ctx, x, y + h * 0.03, w, 3, g.sky[2]);
  const title = (state.title || 'VICE CITY').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = x + w / 2;
  let titleY = y + h * 0.56;
  if (sub) {
    // Keep the script subtitle clear of the heat badge at the right.
    const subSize = fitFont(ctx, sub, w * 0.60, h * 0.20, 'Pacifico, cursive');
    ctx.fillStyle = g.sky[2];
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillText(sub, cx, y + h * 0.24);
    ctx.shadowBlur = 0;
    titleY = y + h * 0.64;
  }
  const size = fitFont(ctx, title, w * 0.90, h * 0.46, 'Anton, "Arial Black", sans-serif');
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(16,4,32,0.95)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeText(title, cx, titleY);
  ctx.fillStyle = state.titleColor || '#ffffff';
  ctx.fillText(title, cx, titleY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (state.showBadge) {
    // Heat badge: tilted pill, top-right of the band.
    ctx.save();
    const bw = Math.min(w * 0.24, 210);
    const bh = h * 0.30;
    ctx.translate(x + w - bw / 2 - w * 0.03, y + bh * 0.72);
    ctx.rotate(-0.07);
    const pill = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    pill.addColorStop(0, '#ff2e88');
    pill.addColorStop(1, '#ff9e57');
    ctx.fillStyle = pill;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(bh * 0.52)}px Anton, "Arial Black", sans-serif`;
    ctx.fillText('★★★★★ HEAT', 0, 1);
    ctx.restore();
  }
}

/**
 * Draws the whole cover onto `canvas` (any size) from `state`.
 * Photos are HTMLImageElements (or null); crops are per panel slot.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const titleH = Math.round(H * (state.layout === 'tilted' ? 0.17 : 0.21));
  const imageH = H - titleH;
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx, W, imageH, state.grade);
  const panels = layoutPanels(state.layout, W, imageH);
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
  if (state.showPalms) {
    const s = Math.min(W, H) * 0.30;
    ctx.save();
    ctx.globalAlpha = 0.96;
    drawPalm(ctx, W * 0.02, imageH * 0.99, s, 0.35, 'rgba(12,2,24,0.95)');
    drawPalm(ctx, W * 0.99, imageH * 0.99, s * 0.8, -0.4, 'rgba(12,2,24,0.95)');
    ctx.restore();
  }
  drawTitleBand(ctx, { x: 0, y: imageH, w: W, h: titleH }, state);
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
