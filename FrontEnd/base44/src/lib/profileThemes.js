// User-selectable profile accent colour. Stored as a plain enum value on
// users/{uid}.profileTheme (never arbitrary CSS from the client — the UI
// only ever writes one of these known keys). Applied to accents *within*
// the profile page only — never the global navbar/site chrome.
export const PROFILE_THEMES = {
  teal: { primary: '#0F766E', soft: '#DDF3F0', border: '#9ED8D1', text: '#0B5E59', label: 'Teal' },
  coral: { primary: '#F97366', soft: '#FFF0EC', border: '#FFC6BB', text: '#C95145', label: 'Coral' },
  sky: { primary: '#0284C7', soft: '#E8F6FC', border: '#BAE6FD', text: '#036994', label: 'Sky blue' },
  peach: { primary: '#EA8A4A', soft: '#FFF0E3', border: '#FFD2AE', text: '#B85E27', label: 'Peach' },
  lime: { primary: '#65A30D', soft: '#EFF8DE', border: '#CDE7A1', text: '#4D7C0F', label: 'Lime green' },
  lavender: { primary: '#8B5CF6', soft: '#F3EEFF', border: '#D8C8FF', text: '#6D3FD1', label: 'Soft lavender' },
  amber: { primary: '#D97706', soft: '#FFF5DB', border: '#FBD38D', text: '#A95405', label: 'Warm amber' },
};

export const DEFAULT_PROFILE_THEME = 'teal';

export function getProfileTheme(key) {
  return PROFILE_THEMES[key] || PROFILE_THEMES[DEFAULT_PROFILE_THEME];
}

// Deterministic, varied chip colour per interest/label string — cycles
// through the theme palette so chips aren't all one flat grey, without
// needing every possible interest name hardcoded to a specific colour.
const CHIP_ROTATION = Object.keys(PROFILE_THEMES);
export function colorForLabel(label) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return PROFILE_THEMES[CHIP_ROTATION[hash % CHIP_ROTATION.length]];
}
