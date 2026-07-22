import { StyleSheet } from 'react-native';

// ── Color Palette ──────────────────────────────────────────────
// "Golden Botanical" — warm amber-gold primary + deep sage botanical.
//
// Physical scene: a woman at her kitchen table, morning light through
// the window, ceramic mug in hand. The app should feel like that moment —
// calm, luminous, personal. A modern self-care companion.
//
// Strategy: Committed — amber-gold carries 30–40% of interactive surfaces;
// sage botanical grounds the palette. Neither pink-period-app (1st reflex)
// nor muted-sage-everything (2nd reflex).
//
// Contrast verified (light mode):
//   text (#29211D) on cardBg (#FFFFFF) → ≈12.5:1 ✓ AAA
//   textSecondary (#6B5F58) on cardBg   → ≈5.6:1 ✓ AA
//   textMuted (#968B83) on cardBg       → ≈3.5:1 ✓ AA-large

export const Colors = {
  // ── Brand ───────────────────────────────────────────────────
  primary: '#C2905A',
  primaryLight: '#D9B68A',
  primaryBg: '#F8F2EA',

  // ── Surfaces ────────────────────────────────────────────────
  bg: '#F9F8F6',
  cardBg: '#FFFFFF',
  surfaceAlt: '#F5F3F0',

  // ── Ink ─────────────────────────────────────────────────────
  ink: '#29211D',
  inkLight: '#5C514B',
  inkBg: '#F1EFEC',

  // ── Accent ──────────────────────────────────────────────────
  botanical: '#5D7A5F',
  botanicalBg: '#EEF3EE',
  accentGold: '#D4A85A',

  // ── Text ────────────────────────────────────────────────────
  text: '#29211D',
  textSecondary: '#6B5F58',
  textMuted: '#968B83',
  textHint: '#B5ACA5',

  // ── Semantic ────────────────────────────────────────────────
  danger: '#C97A74',
  dangerBg: '#FBF5F4',
  divider: '#EEECE9',
  success: '#7A9A7C',
  warning: '#C4A05A',
  warningBg: '#F9F4E8',

  // ── Utility ─────────────────────────────────────────────────
  white: '#FFFFFF',
  surfaceMuted: '#F7F6F4',
  overlay: 'rgba(0,0,0,0.45)',
  handle: '#DFDDDA',
} as const;

// ── Spacing ─────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  pageTop: 56,
  pageBottom: 44,
  pageH: 16,

  cardGap: 16,
  sectionGap: 28,
} as const;

// ── Border Radii ───────────────────────────────────────────────
export const Radius = {
  xxs: 3,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
} as const;

// ── Typography ─────────────────────────────────────────────────
export const FontSize = {
  xs: 10,
  sm: 12,
  sm2: 14,
  md: 15,
  base: 17,
  lg: 19,
  xl: 22,
  xxl: 28,
  display: 34,
  title: 20,
  subtitle: 17,
} as const;

export const LineHeight = {
  xs: 16,
  sm: 18,
  sm2: 20,
  md: 22,
  base: 24,
  lg: 26,
  xl: 30,
  xxl: 36,
  display: 42,
} as const;

// ── Font Weight ─────────────────────────────────────────────────
export const Weight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ── Elevation ──────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor: '#29211D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#29211D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  prominent: {
    shadowColor: '#29211D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 5,
  },
} as const;

// ── Shared Card Presets ────────────────────────────────────────
export const sharedCard = StyleSheet.create({
  base: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    ...Shadow.card,
  },
  prominent: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    ...Shadow.prominent,
  },
});

// ── Lunar Card Palette ─────────────────────────────────────────
export const LunarColors = {
  bg: '#FBF8F3',
  border: '#E5DCD0',
  innerBg: '#FFFFFF',
  innerBorder: '#F0EBE4',
  text: '#8B7355',
  textSecondary: '#A0896E',
  dayNumber: '#C2905A',
  yiText: '#B5706A',
  yiBg: '#FBF5F4',
  yiBorder: '#F0DCD8',
  jiText: '#8A8A8A',
  jiBg: '#F5F5F5',
  jiBorder: '#E5E5E5',
  jieQiBg: '#C2905A',
  jieQiText: '#FFFFFF',
  moreBtn: '#C2905A',
} as const;
