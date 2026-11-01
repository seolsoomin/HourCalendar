const WEIGHT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

const ALL = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export const FONTS = [
  { key: 'pretendard', label: '프리텐다드', family: "'Pretendard'", weights: ALL, defaultWeight: 400 },
  { key: 'paperozi', label: '페이퍼로지', family: "'Paperozi'", weights: ALL, defaultWeight: 600 },
  { key: 'busan-dandi', label: '부산단디손글씨', family: "'BusanDandiHandwriting'", weights: [400], defaultWeight: 400 },
  { key: 'maru-buri', label: '마루 부리', family: "'MaruBuri'", weights: [200, 300, 400, 600, 700], defaultWeight: 400 },
  { key: 'ongleip-konkon', label: '온글잎 콘콘', family: "'OngleipKonkon'", weights: [400], defaultWeight: 400 },
  {
    key: 'wanted-sans',
    label: 'Wanted Sans',
    family: "'Wanted Sans Variable', 'Wanted Sans'",
    weights: [400, 500, 600, 700, 800, 900],
    defaultWeight: 400,
  },
  { key: 'nanum-square-round', label: '나눔스퀘어 라운드', family: "'NanumSquareRound'", weights: [400], defaultWeight: 400 },
  { key: 'd2coding', label: 'D2Coding', family: "'D2Coding'", weights: [400], defaultWeight: 400 },
];

const DEFAULT_FONT = FONTS.find((f) => f.key === 'paperozi');

export const weightName = (weight) => WEIGHT_NAMES[weight] ?? String(weight);

export const fontValue = (font, weight) => `${font.key}-${weight}`;

export function parseFont(value) {
  const match = /^(.+)-(\d{3})$/.exec(value || '');
  const key = match ? match[1] : value;
  const font = FONTS.find((f) => f.key === key) ?? DEFAULT_FONT;
  const wanted = match && font.key === key ? Number(match[2]) : font.defaultWeight;
  const weight = font.weights.includes(wanted) ? wanted : font.defaultWeight;
  return { font, weight, value: fontValue(font, weight) };
}

export function applyFont(value) {
  const { font, weight } = parseFont(value);
  const root = document.documentElement.style;
  root.setProperty('--app-font', `${font.family}, sans-serif`);
  root.setProperty('--app-font-weight', String(weight));
}
