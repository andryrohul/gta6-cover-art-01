// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo loaded;
// ?shot=cover draws one exported cover full-frame at the requested size.
// Query params: photos (comma-separated sample names in panel order, e.g.
// photos=boulevard,portrait,highway,gasstation,pier,street), photo (legacy: one
// sample name, the rest fill in SAMPLES order), caption, subtitle, layout, grade, w, h.
// window.__shotReady is set once the scene has painted.
import { SAMPLES } from './cover.js';

export async function runShot(shot, query, app) {
  const { state, canvas, redraw, loadImage, setStatus } = app;
  const layout = query.get('layout');
  const grade = query.get('grade');
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (query.get('caption')) {
    state.title = query.get('caption');
    document.getElementById('title').value = state.title;
  }
  if (query.get('subtitle')) {
    state.subtitle = query.get('subtitle');
    document.getElementById('subtitle').value = state.subtitle;
  }
  // Panel order comes from `photos` when given; otherwise the named `photo`
  // leads and the remaining samples follow in SAMPLES order, so every panel
  // shows a different scene instead of the same two photos alternating.
  let names = (query.get('photos') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SAMPLES.includes(s));
  if (!names.length) {
    const first = query.get('photo') ?? 'boulevard';
    names = [first, ...SAMPLES.filter((s) => s !== first)];
  }
  const loaded = {};
  for (const name of new Set(names)) {
    loaded[name] = await loadImage(`samples/${name}.jpg`);
  }
  // Keep every sample in a slot so the editor's photo picker stays complete.
  SAMPLES.forEach((name, i) => {
    if (loaded[name]) state.photos[i] = loaded[name];
  });
  const slotOf = (name) => SAMPLES.indexOf(name);
  state.panelPhoto = state.panelPhoto.map((_, i) => slotOf(names[i % names.length]));
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w') || 1280);
    const h = Number(query.get('h') || 720);
    canvas.width = w;
    canvas.height = h;
    redraw();
    setStatus('Cover scene ready.');
  } else {
    redraw();
    setStatus('Editor scene ready.');
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
