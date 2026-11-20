// main.js — the editor for Vice City Sunset.
//
// It wires the cover renderer (cover.js) to the page: the photo slots, the
// layout and grade pickers, the words, per-panel crop and zoom, and the
// PNG export. Photos a person uploads are read on their own machine and
// never leave it. A ?shot=<id> URL draws one of the screenshot scenes
// full-frame instead of the editor.

import { GRADES, LAYOUTS, SIZES, hitPanel, renderCover } from './cover.js';
import { DEFAULT_STATE, SAMPLES, SHOTS } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const photoSlotsEl = document.getElementById('photoSlots');
const layoutButtonsEl = document.getElementById('layoutButtons');
const gradeButtonsEl = document.getElementById('gradeButtons');
const sizePickerEl = document.getElementById('sizePicker');
const exportButton = document.getElementById('exportButton');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const taglineInput = document.getElementById('taglineInput');
const selectedLabel = document.getElementById('selectedLabel');
const zoomRange = document.getElementById('zoomRange');
const zoomValue = document.getElementById('zoomValue');
const centerCropButton = document.getElementById('centerCropButton');
const fileInput = document.getElementById('fileInput');

const state = {
  layout: DEFAULT_STATE.layout,
  grade: DEFAULT_STATE.grade,
  size: DEFAULT_STATE.size,
  title: DEFAULT_STATE.title,
  subtitle: DEFAULT_STATE.subtitle,
  tagline: DEFAULT_STATE.tagline,
  photos: SAMPLES.map(() => null),
  labels: SAMPLES.map((s) => s.label),
  focus: SAMPLES.map((s) => ({ fx: s.focus.fx, fy: s.focus.fy, zoom: 1 })),
  selectedPanel: -1,
  replacingSlot: 0,
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  const loaded = await Promise.all(SAMPLES.map((s) => loadImage(s.src)));
  loaded.forEach((img, i) => {
    if (img) state.photos[i] = img;
  });
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // The cover still draws with the fallback fonts.
  }
}

// ------------------------------------------------------------ the preview

function render() {
  renderCover(canvas, state);
  syncCropControls();
}

function syncCropControls() {
  const panel = state.selectedPanel;
  if (panel < 0) {
    selectedLabel.textContent = 'No panel selected — click the cover.';
    zoomRange.disabled = true;
    centerCropButton.disabled = true;
    return;
  }
  const panels = currentPanels();
  const photoIndex = panels[panel]?.photo ?? 0;
  const focus = state.focus[photoIndex];
  selectedLabel.textContent =
    `Panel ${panel + 1} — ${state.labels[photoIndex]} (photo ${photoIndex + 1} of 6)`;
  zoomRange.disabled = false;
  centerCropButton.disabled = false;
  zoomRange.value = String(focus.zoom);
  zoomValue.textContent = `${focus.zoom.toFixed(2)}×`;
}

function currentPanels() {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.mosaic;
  const W = canvas.width;
  const H = canvas.height;
  return layout.panels(W, H).map((p) => ({
    x: p.x * W,
    y: p.y * H,
    w: p.w * W,
    h: p.h * H,
    photo: p.photo,
  }));
}

// -------------------------------------------------------------- the pickers

function buildSizePicker() {
  for (const [id, size] of Object.entries(SIZES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'size-button';
    button.textContent = size.label;
    button.setAttribute('aria-pressed', String(state.size === id));
    button.addEventListener('click', () => {
      state.size = id;
      for (const b of sizePickerEl.children) {
        b.setAttribute('aria-pressed', String(b === button));
      }
      render();
    });
    sizePickerEl.appendChild(button);
  }
}

function buildLayoutButtons() {
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick-button';
    button.textContent = layout.name;
    button.title = layout.blurb;
    button.setAttribute('aria-pressed', String(state.layout === id));
    button.addEventListener('click', () => {
      state.layout = id;
      state.selectedPanel = -1;
      for (const b of layoutButtonsEl.children) {
        b.setAttribute('aria-pressed', String(b === button));
      }
      render();
    });
    layoutButtonsEl.appendChild(button);
  }
}

function buildGradeButtons() {
  for (const [id, grade] of Object.entries(GRADES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grade-swatch';
    button.style.background = grade.swatch;
    button.title = grade.name;
    button.setAttribute('aria-label', `${grade.name} grade`);
    button.setAttribute('aria-pressed', String(state.grade === id));
    button.addEventListener('click', () => {
      state.grade = id;
      for (const b of gradeButtonsEl.children) {
        b.setAttribute('aria-pressed', String(b === button));
      }
      render();
    });
    gradeButtonsEl.appendChild(button);
  }
}

function buildPhotoSlots() {
  SAMPLES.forEach((sample, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'photo-slot';
    slot.title = `${sample.label} — click to replace with your own photo`;
    const thumb = document.createElement('img');
    thumb.src = sample.src;
    thumb.alt = sample.label;
    const name = document.createElement('span');
    name.textContent = sample.label;
    slot.append(thumb, name);
    slot.addEventListener('click', () => {
      state.replacingSlot = i;
      fileInput.click();
    });
    photoSlotsEl.appendChild(slot);
  });
}

// ------------------------------------------------------------------ upload

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const i = state.replacingSlot;
      state.photos[i] = img;
      state.labels[i] = file.name.replace(/\.[^.]+$/, '');
      state.focus[i] = { fx: 0.5, fy: 0.5, zoom: 1 };
      const slot = photoSlotsEl.children[i];
      slot.classList.add('custom');
      slot.querySelector('img').src = reader.result;
      slot.querySelector('span').textContent = state.labels[i];
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  fileInput.value = '';
});

// ------------------------------------------------------- crop: drag + zoom

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function selectedFocus() {
  const panels = currentPanels();
  const panel = panels[state.selectedPanel];
  if (!panel) return null;
  return { panel, focus: state.focus[panel.photo], photo: state.photos[panel.photo] };
}

let dragging = false;
let lastPoint = null;

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const panel = hitPanel(state.layout, canvas.width, canvas.height, point.x, point.y);
  state.selectedPanel = panel;
  if (panel >= 0) {
    dragging = true;
    lastPoint = point;
    canvas.setPointerCapture(event.pointerId);
  }
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging || !lastPoint) return;
  const point = canvasPoint(event);
  const sel = selectedFocus();
  if (!sel || !sel.photo) return;
  const { panel, focus, photo } = sel;
  const scale = Math.max(panel.w / photo.naturalWidth, panel.h / photo.naturalHeight) * focus.zoom;
  const overflowX = photo.naturalWidth * scale - panel.w;
  const overflowY = photo.naturalHeight * scale - panel.h;
  if (overflowX > 0) focus.fx = clamp(focus.fx - (point.x - lastPoint.x) / overflowX, 0, 1);
  if (overflowY > 0) focus.fy = clamp(focus.fy - (point.y - lastPoint.y) / overflowY, 0, 1);
  lastPoint = point;
  render();
});

canvas.addEventListener('pointerup', () => {
  dragging = false;
  lastPoint = null;
});

canvas.addEventListener('wheel', (event) => {
  const sel = selectedFocus();
  if (!sel) return;
  event.preventDefault();
  sel.focus.zoom = clamp(sel.focus.zoom * Math.exp(-event.deltaY * 0.0012), 1, 2.5);
  render();
}, { passive: false });

zoomRange.addEventListener('input', () => {
  const sel = selectedFocus();
  if (!sel) return;
  sel.focus.zoom = Number(zoomRange.value);
  render();
});

centerCropButton.addEventListener('click', () => {
  const sel = selectedFocus();
  if (!sel) return;
  sel.focus.fx = 0.5;
  sel.focus.fy = 0.5;
  sel.focus.zoom = 1;
  render();
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ------------------------------------------------------------------- words

titleInput.addEventListener('input', () => {
  state.title = titleInput.value.trim() || 'VICE CITY';
  render();
});

subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  render();
});

taglineInput.addEventListener('input', () => {
  state.tagline = taglineInput.value;
  render();
});

// ------------------------------------------------------------------ export

exportButton.addEventListener('click', () => {
  const offscreen = document.createElement('canvas');
  renderCover(offscreen, state);
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-city-cover-${state.size}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
});

// --------------------------------------------------------------- shot mode

function applyShot(shotId) {
  const shot = SHOTS.find((s) => s.id === shotId);
  if (!shot) return false;
  state.layout = shot.layout;
  state.grade = shot.grade;
  state.size = shot.size;
  state.title = shot.title;
  state.subtitle = shot.subtitle;
  state.tagline = shot.tagline;
  titleInput.value = shot.title;
  subtitleInput.value = shot.subtitle;
  taglineInput.value = shot.tagline;
  if (shot.id !== 'editor') document.body.classList.add('shot-mode');
  return true;
}

// --------------------------------------------------------------------- boot

buildSizePicker();
buildLayoutButtons();
buildGradeButtons();
buildPhotoSlots();

const shotId = new URLSearchParams(window.location.search).get('shot');
if (shotId) applyShot(shotId);

await loadFonts();
await loadSamples();
render();
if (shotId) document.title = 'shot-ready';
