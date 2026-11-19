// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo loaded;
// ?shot=cover draws one exported cover full-frame at the requested size.
// Query params: photo (boulevard|pier), caption, subtitle, layout, grade, w, h.
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, app) {
  const { state, canvas, redraw, loadImage, setStatus } = app;
  const photoName = query.get('photo') ?? 'boulevard';
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
  // Put the named sample in every panel slot that names it, so a one-photo
  // cover still fills a multi-panel layout.
  const sample = await loadImage(`samples/${photoName}.jpg`);
  const other = photoName === 'boulevard' ? 'pier' : 'boulevard';
  const second = await loadImage(`samples/${other}.jpg`);
  state.photos[0] = sample;
  state.photos[1] = second;
  state.panelPhoto = state.panelPhoto.map((_, i) => (i % 2 === 0 ? 0 : 1));
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
