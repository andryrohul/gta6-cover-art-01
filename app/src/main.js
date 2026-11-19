// Vice City Sunset editor: wires the controls to the cover engine, loads the user's
// photos (local only, never uploaded), and exports full-resolution PNGs.
import { drawCover, exportCoverCanvas, defaultState, layoutPanels, LAYOUTS, GRADES, PRESETS, TITLE_COLORS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
let selectedPanel = 0;
let dragging = null;

function setStatus(msg) { status.textContent = msg; }

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state);
  syncPanelControls();
}

/** Title-band height matches the engine so hit-testing lines up. */
function imageArea() {
  const titleH = Math.round(canvas.height * (state.layout === 'tilted' ? 0.17 : 0.21));
  return { titleH, imageH: canvas.height - titleH };
}

function panelRects() {
  const { imageH } = imageArea();
  return layoutPanels(state.layout, canvas.width, imageH);
}

function syncPanelControls() {
  const panels = panelRects();
  if (selectedPanel >= panels.length) selectedPanel = 0;
  document.getElementById('panel-label').textContent =
    `Panel ${selectedPanel + 1} of ${panels.length} selected — drag it on the cover to pan`;
  const crop = state.crops[selectedPanel] || { ox: 0, oy: 0, zoom: 1 };
  document.getElementById('zoom').value = String(crop.zoom);
  const sel = document.getElementById('panel-photo');
  sel.value = String(state.panelPhoto[selectedPanel] ?? 0);
}

function buildChips() {
  const layouts = document.getElementById('layouts');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (l.id === state.layout ? ' on' : '');
    b.dataset.layout = l.id;
    b.innerHTML = `${l.name}<small>${l.blurb} · ${l.panels} panel${l.panels > 1 ? 's' : ''}</small>`;
    b.addEventListener('click', () => {
      state.layout = l.id;
      selectedPanel = 0;
      layouts.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
      redraw();
    });
    layouts.appendChild(b);
  });

  const grades = document.getElementById('grades');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (g.id === state.grade ? ' on' : '');
    b.textContent = g.name;
    b.style.background = `linear-gradient(135deg, ${g.sky[1]}, ${g.sky[2]})`;
    b.addEventListener('click', () => {
      state.grade = g.id;
      grades.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      redraw();
    });
    grades.appendChild(b);
  });

  const presets = document.getElementById('presets');
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `${p.title} — ${p.subtitle}`;
    b.addEventListener('click', () => {
      state.title = p.title;
      state.subtitle = p.subtitle;
      document.getElementById('title').value = p.title;
      document.getElementById('subtitle').value = p.subtitle;
      redraw();
      setStatus(`Caption preset applied: ${p.title}`);
    });
    presets.appendChild(b);
  });

  const colors = document.getElementById('colors');
  TITLE_COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (c === state.titleColor ? ' on' : '');
    b.style.background = c;
    b.title = c;
    b.setAttribute('aria-label', `Title colour ${c}`);
    b.addEventListener('click', () => {
      state.titleColor = c;
      colors.querySelectorAll('.swatch').forEach((s) => s.classList.remove('on'));
      b.classList.add('on');
      redraw();
    });
    colors.appendChild(b);
  });
}

function buildPhotoSelect() {
  const sel = document.getElementById('panel-photo');
  sel.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = state.photos[i] ? `Photo ${i + 1}` : `Photo ${i + 1} (empty)`;
    sel.appendChild(o);
  }
}

function buildThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const img = state.photos[i];
    if (img) {
      const t = document.createElement('img');
      t.className = 'thumb';
      t.src = img.src;
      t.alt = `Photo ${i + 1}`;
      t.title = `Use photo ${i + 1} in the selected panel`;
      t.addEventListener('click', () => {
        state.panelPhoto[selectedPanel] = i;
        buildThumbs();
        buildPhotoSelect();
        redraw();
      });
      box.appendChild(t);
    } else {
      const d = document.createElement('div');
      d.className = 'thumb-empty';
      d.textContent = '+';
      d.title = `Photo slot ${i + 1} — add a photo above`;
      box.appendChild(d);
    }
  }
}

async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) { setStatus('That file is not an image.'); return; }
  for (const file of list) {
    const slot = state.photos.findIndex((p) => p === null);
    if (slot === -1) { setStatus('All 4 photo slots are full.'); break; }
    const img = await loadImage(URL.createObjectURL(file));
    state.photos[slot] = img;
  }
  buildThumbs();
  buildPhotoSelect();
  redraw();
  setStatus(`${state.photos.filter(Boolean).length} photo(s) loaded — pick a layout and export.`);
}

function exportSize(spec) {
  const [w, h] = spec.split('x').map(Number);
  const out = exportCoverCanvas(state, w, h);
  out.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-city-cover-${w}x${h}.png`);
  }, 'image/png');
}

function wireControls() {
  document.getElementById('photos').addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });
  document.getElementById('fill-all').addEventListener('click', () => {
    state.panelPhoto = state.panelPhoto.map(() => 0);
    buildPhotoSelect();
    redraw();
    setStatus('All panels now show photo 1.');
  });
  document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  document.getElementById('palms').addEventListener('change', (e) => { state.showPalms = e.target.checked; redraw(); });
  document.getElementById('badge').addEventListener('change', (e) => { state.showBadge = e.target.checked; redraw(); });
  document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.crops[selectedPanel].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('zoom-in').addEventListener('click', () => {
    const c = state.crops[selectedPanel];
    c.zoom = Math.min(2.5, c.zoom + 0.25);
    redraw();
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    const c = state.crops[selectedPanel];
    c.zoom = Math.max(1, c.zoom - 0.25);
    redraw();
  });
  document.getElementById('crop-reset').addEventListener('click', () => {
    state.crops[selectedPanel] = { ox: 0, oy: 0, zoom: 1 };
    redraw();
  });
  document.getElementById('panel-photo').addEventListener('change', (e) => {
    state.panelPhoto[selectedPanel] = Number(e.target.value);
    buildThumbs();
    redraw();
  });
  document.querySelectorAll('.export-btn').forEach((b) => {
    b.addEventListener('click', () => exportSize(b.dataset.size));
  });
  document.getElementById('export-all').addEventListener('click', async () => {
    for (const spec of ['1080x1080', '1080x1350', '1920x1080']) {
      exportSize(spec);
      await new Promise((r) => setTimeout(r, 350));
    }
    setStatus('Exported all 3 sizes — check your downloads.');
  });
}

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function wireCanvas() {
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const { imageH } = imageArea();
    if (p.y > imageH) return;
    const panels = panelRects();
    const hit = panels.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (hit === -1) return;
    selectedPanel = hit;
    dragging = { x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
    syncPanelControls();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = canvasPoint(e);
    const panels = panelRects();
    const rect = panels[selectedPanel];
    if (!rect) return;
    const crop = state.crops[selectedPanel];
    crop.ox = Math.max(-1, Math.min(1, crop.ox - ((p.x - dragging.x) / rect.w) * 2));
    crop.oy = Math.max(-1, Math.min(1, crop.oy - ((p.y - dragging.y) / rect.h) * 2));
    dragging = { x: p.x, y: p.y };
    redraw();
  });
  const endDrag = () => { dragging = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const crop = state.crops[selectedPanel];
    crop.zoom = Math.max(1, Math.min(2.5, crop.zoom - Math.sign(e.deltaY) * 0.1));
    redraw();
  }, { passive: false });
}

/** Preloads the two free sample photos so the first open already shows a cover. */
async function loadSamples() {
  try {
    state.photos[0] = await loadImage('samples/boulevard.jpg');
    state.photos[1] = await loadImage('samples/pier.jpg');
  } catch { /* samples are optional; the editor still works with uploads */ }
  buildThumbs();
  buildPhotoSelect();
  redraw();
}

// Test / screenshot hook: the app's own state and exporters, no network involved.
window.__coverApp = { state, drawCover, exportCoverCanvas, redraw };

buildChips();
wireControls();
wireCanvas();
buildPhotoSelect();
buildThumbs();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Fixed scenes for screenshots: ?shot=editor / ?shot=cover (see shots.js).
  await loadSamples();
  await document.fonts.load('16px Anton');
  await document.fonts.load('16px Pacifico');
  await document.fonts.ready;
  runShot(shot, params, { state, canvas, redraw, loadImage, setStatus });
} else {
  await loadSamples();
  // Re-draw once the display fonts arrive so the title uses Anton, not a fallback.
  document.fonts.load('16px Anton').then(redraw);
  document.fonts.load('16px Pacifico').then(redraw);
}
