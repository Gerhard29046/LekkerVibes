// Category → colour "personality" mapping for place cards — the start of a
// sitewide system (Discover today, Communities/Area pages later) where each
// place type gets a consistent accent instead of one flat brand colour
// everywhere. Matched by keyword against whatever category string is on
// hand (a Google Places type or one of Discover's own filter categories),
// so it degrades gracefully to the primary teal for anything unrecognised
// rather than needing an exhaustive exact-match table.
const FAMILIES = {
  green: { bg: 'rgba(99, 153, 34, 0.16)', text: '#a8d66b', border: 'rgba(99, 153, 34, 0.4)' },
  blue: { bg: 'rgba(55, 138, 221, 0.16)', text: '#8dc1f5', border: 'rgba(55, 138, 221, 0.4)' },
  coral: { bg: 'rgba(216, 90, 48, 0.16)', text: '#f0a684', border: 'rgba(216, 90, 48, 0.4)' },
  teal: { bg: 'rgba(29, 158, 117, 0.16)', text: '#9fe1cb', border: 'rgba(29, 158, 117, 0.4)' },
  neutral: { bg: 'rgba(255, 255, 255, 0.08)', text: '#c7d2d6', border: 'rgba(255, 255, 255, 0.22)' },
};

const RULES = [
  [/faith|communit|book\s*club|gaming/i, 'neutral'],
  [/hik|trail|run|cycl|nature|park|outdoor|wildlife/i, 'green'],
  [/water|harbour|harbor|waterfront|marina|boat|pier|dock/i, 'blue'],
  [/mountain|adventure|climb/i, 'coral'],
  [/beach|coast|surf|wellness|yoga|spa/i, 'teal'],
];

export function getCategoryTheme(category) {
  if (category) {
    for (const [pattern, family] of RULES) {
      if (pattern.test(category)) return FAMILIES[family];
    }
  }
  return FAMILIES.teal;
}
