const INK = '#262626';
const DARK_BG = '#121212';

export const ACCENTS = [
  { key: 'red', label: '빨강', light: '#E5484D', dark: '#FF6B6F' },
  { key: 'orange', label: '주황', light: '#E06A1B', dark: '#FF9A52' },
  { key: 'yellow', label: '노랑', light: '#E3B008', dark: '#F5C842', onLight: INK, textLight: '#A47A00' },
  { key: 'green', label: '초록', light: '#2F9E62', dark: '#5CC489' },
  { key: 'blue', label: '파랑', light: '#3B82F6', dark: '#6AA5FF' },
  { key: 'navy', label: '남색', light: '#2E3A8C', dark: '#8591E6' },
  { key: 'purple', label: '보라', light: '#8F87F1', dark: '#A49EFF', isDefault: true },
  { key: 'brown', label: '갈색', light: '#9C6B48', dark: '#C99A76' },
  { key: 'mono', label: '흑백', light: '#555555', dark: '#C8C8C8' },
];

export const DEFAULT_ACCENT = ACCENTS.find((a) => a.isDefault);

export function findAccent(hex) {
  const upper = (hex || '').toUpperCase();
  return ACCENTS.find((a) => a.light.toUpperCase() === upper) ?? DEFAULT_ACCENT;
}

function toRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function mix(base, over, ratio) {
  const a = toRgb(base);
  const b = toRgb(over);
  return toHex(a.map((v, i) => v * (1 - ratio) + b[i] * ratio));
}

const TOKENS = [
  '--color-primary', '--button-hover-bg', '--cell-selected-bg', '--icon-color', '--profile-icon',
  '--chip-bg', '--chip-color', '--chip-active-bg', '--cell-hover-border',
  '--cell-selected-color', '--button-hover-color',
  '--bg-body', '--border-box', '--border-inner', '--bg-inner', '--bg-profile', '--cell-hover', '--input-border',
];

function lightTokens(a) {
  const p = a.light;
  const on = a.onLight ?? '#FFFFFF';
  const W = '#FFFFFF';
  return {
    '--color-primary': a.textLight ?? p,
    '--button-hover-bg': p,
    '--cell-selected-bg': p,
    '--icon-color': a.textLight ?? p,
    '--profile-icon': mix(p, W, 0.2),
    '--chip-bg': p,
    '--chip-color': on,
    '--chip-active-bg': mix(p, W, 0.25),
    '--cell-hover-border': mix(p, W, 0.35),
    '--cell-selected-color': on,
    '--button-hover-color': on,
  };
}

function darkTokens(a) {
  const p = a.dark;
  return {
    '--color-primary': p,
    '--button-hover-bg': p,
    '--cell-selected-bg': p,
    '--icon-color': p,
    '--profile-icon': p,
    '--chip-bg': mix(p, DARK_BG, 0.3),
    '--chip-color': '#FFFFFF',
    '--chip-active-bg': mix(p, DARK_BG, 0.25),
    '--cell-hover-border': p,
    '--cell-selected-color': DARK_BG,
    '--button-hover-color': DARK_BG,
  };
}

export function applyAccent(hex, theme) {
  const style = document.documentElement.style;
  TOKENS.forEach((t) => style.removeProperty(t));
  const accent = findAccent(hex);
  if (accent.isDefault) return;
  const tokens = theme === 'dark' ? darkTokens(accent) : lightTokens(accent);
  Object.entries(tokens).forEach(([name, value]) => style.setProperty(name, value));
}
