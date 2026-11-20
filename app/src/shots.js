// shots.js — the built-in sample photos, the default cover state and the
// four screenshot scenes. Every sample is a photo made for this app; the
// editor replaces any of them with a photo from the user's own machine.

export const SAMPLES = [
  {
    src: 'samples/portrait.jpg',
    label: 'Portrait',
    focus: { fx: 0.5, fy: 0.32 },
    note: 'A confident driver in gold light, face in the upper third.',
  },
  {
    src: 'samples/street.jpg',
    label: 'Neon street',
    focus: { fx: 0.5, fy: 0.5 },
    note: 'A wet night street under pink and teal neon.',
  },
  {
    src: 'samples/boulevard.jpg',
    label: 'Boulevard',
    focus: { fx: 0.5, fy: 0.45 },
    note: 'A palm-lined boulevard at golden hour.',
  },
  {
    src: 'samples/highway.jpg',
    label: 'Highway',
    focus: { fx: 0.5, fy: 0.55 },
    note: 'An open highway running into a dusk skyline.',
  },
  {
    src: 'samples/gasstation.jpg',
    label: 'Gas station',
    focus: { fx: 0.5, fy: 0.5 },
    note: 'A roadside station glowing against the night.',
  },
  {
    src: 'samples/pier.jpg',
    label: 'Pier',
    focus: { fx: 0.5, fy: 0.42 },
    note: 'A wooden pier over turquoise water at noon.',
  },
];

// The cover the editor opens with: the mosaic default, fever grade, the
// six samples filling the six panels in order.
export const DEFAULT_STATE = {
  layout: 'mosaic',
  grade: 'fever',
  size: 'wide',
  title: 'VICE CITY',
  subtitle: 'Sunset Stories',
  tagline: 'LEONIDA • SUNSHINE STATE',
};

// One scene per screenshot file. A scene is opened as ?shot=<id>; the app
// then draws that cover full-frame (or the editor, for the editor scene)
// so a screenshot is a capture of the app itself, never a composite.
export const SHOTS = [
  {
    id: 'cover',
    file: '1-cover.jpg',
    width: 1280,
    height: 720,
    layout: 'mosaic',
    grade: 'fever',
    size: 'wide',
    title: 'VICE CITY',
    subtitle: 'Sunset Stories',
    tagline: 'LEONIDA • SUNSHINE STATE',
  },
  {
    id: 'editor',
    file: '2-editor.jpg',
    width: 1280,
    height: 720,
    layout: 'mosaic',
    grade: 'fever',
    size: 'wide',
    title: 'VICE CITY',
    subtitle: 'Sunset Stories',
    tagline: 'LEONIDA • SUNSHINE STATE',
  },
  {
    id: 'portrait',
    file: '3-cover-portrait.jpg',
    width: 1024,
    height: 1280,
    layout: 'mosaic',
    grade: 'sunset',
    size: 'portrait',
    title: 'VICE CITY',
    subtitle: 'Golden Hour',
    tagline: 'LEONIDA • SUNSHINE STATE',
  },
  {
    id: 'square',
    file: '4-cover-square.jpg',
    width: 1024,
    height: 1024,
    layout: 'grid9',
    grade: 'neon',
    size: 'square',
    title: 'VICE CITY',
    subtitle: 'Neon Nights',
    tagline: 'LEONIDA • SUNSHINE STATE',
  },
];
