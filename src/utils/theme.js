import { ms } from './responsive';

export const COLORS = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  deep:       '#0A0518',
  deep2:      '#12082A',
  deep3:      '#1A0A3E',
  deep4:      '#221052',

  // ── Gold accent ────────────────────────────────────────────────────────────
  gold:       '#C9A84C',
  goldLight:  '#F0D080',
  goldBright: '#FFD966',
  goldDark:   '#9E7C30',
  goldBg:     'rgba(201,168,76,0.12)',
  goldBg2:    'rgba(201,168,76,0.20)',

  // ── Rose / Pink ────────────────────────────────────────────────────────────
  pink:       '#E8547A',
  pinkLight:  '#FF8FA8',
  pinkDark:   '#B5395A',
  pinkBg:     'rgba(232,84,122,0.12)',

  // ── Semantic ───────────────────────────────────────────────────────────────
  cream:      '#FDF6EC',
  creamDim:   'rgba(253,246,236,0.75)',
  green:      '#48C78E',
  greenBg:    'rgba(72,199,142,0.12)',
  yellow:     '#FFB800',
  yellowBg:   'rgba(255,184,0,0.12)',
  blue:       '#63B3ED',
  blueBg:     'rgba(99,179,237,0.12)',
  red:        '#FF4757',
  redBg:      'rgba(255,71,87,0.12)',
  purple:     '#AF52DE',
  purpleBg:   'rgba(175,82,222,0.12)',

  // ── Surfaces ───────────────────────────────────────────────────────────────
  surface1:   'rgba(255,255,255,0.04)',
  surface2:   'rgba(255,255,255,0.07)',
  surface3:   'rgba(255,255,255,0.11)',
  surface4:   'rgba(255,255,255,0.16)',

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:   '#FDF6EC',
  textSecondary: 'rgba(253,246,236,0.65)',
  textMuted:     'rgba(253,246,236,0.38)',
  textDisabled:  'rgba(253,246,236,0.22)',

  // ── Borders ────────────────────────────────────────────────────────────────
  border:        'rgba(201,168,76,0.25)',
  borderLight:   'rgba(255,255,255,0.09)',
  borderStrong:  'rgba(201,168,76,0.45)',

  // ── Overlay ────────────────────────────────────────────────────────────────
  overlay:    'rgba(6,2,14,0.88)',
  overlay2:   'rgba(6,2,14,0.95)',
};

export const GRADIENTS = {
  background:  ['#0A0518', '#12082A', '#1A0A3E'],
  gold:        ['#C9A84C', '#F0D080', '#C9A84C'],
  goldSubtle:  ['rgba(201,168,76,0.18)', 'rgba(201,168,76,0.06)'],
  card:        ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
  pink:        ['#E8547A', '#FF8FA8'],
  green:       ['#48C78E', '#2ECC8A'],
  header:      ['#12082A', '#0A0518'],
  shimmer:     ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.0)'],
};

export const SPACING = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl:64,
};

export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   22,
  xxl:  30,
  xxxl: 40,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  pink: {
    shadowColor: '#E8547A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 10,
  },
  green: {
    shadowColor: '#48C78E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
};

export const TYPOGRAPHY = {
  h1:     { fontSize: ms(28), fontWeight: '800', letterSpacing: -0.5 },
  h2:     { fontSize: ms(22), fontWeight: '700', letterSpacing: -0.3 },
  h3:     { fontSize: ms(18), fontWeight: '700', letterSpacing: -0.2 },
  h4:     { fontSize: ms(15), fontWeight: '600', letterSpacing: 0 },
  body:   { fontSize: ms(14), fontWeight: '400', lineHeight: ms(22) },
  bodyM:  { fontSize: ms(14), fontWeight: '500' },
  bodyB:  { fontSize: ms(14), fontWeight: '700' },
  caption:{ fontSize: ms(12), fontWeight: '400' },
  captionB:{ fontSize: ms(12), fontWeight: '600' },
  label:  { fontSize: ms(11), fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  tiny:   { fontSize: ms(10), fontWeight: '500', letterSpacing: 0.4 },
};

export const FONTS = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
};
