import { StyleSheet } from 'react-native';

// Central design tokens — single source of truth for the app's visual language
export const Colors = {
  primary: '#FF69B4',
  primaryLight: '#FFB6C1',
  primaryBg: '#FFF0F3',
  /** Warm off-white with rose undertone — page background. */
  bg: '#F7F3F4',
  cardBg: '#FFFFFF',
  /** Warm deep plum — the contrast anchor. Used for strongest text, key data. */
  ink: '#1E1828',
  /** Warm plum — icons and accents on non-period cards. */
  inkLight: '#4D3545',
  /** Warm rose gray — tag and section backgrounds on non-period cards. */
  inkBg: '#F0E8EC',
  /** Warm tinted card surface — for alternating card backgrounds. */
  surfaceWarm: '#FAF5F3',
  /** Warm dusty rose — decorative accent for non-period UI elements. */
  accentWarm: '#C4758A',
  text: '#333333',
  textSecondary: '#666666',
  /** Muted — darkened vs. the old #999 to meet 4.5:1 on white (WCAG AA). */
  textMuted: '#767676',
  /** Hint — darkened vs. the old #BBB to meet 4.5:1 on white. */
  textHint: '#949494',
  danger: '#E57373',
  dangerBg: '#FFF5F5',
  dangerLight: '#CC5555',
  divider: '#F0F0F0',
  success: '#4CAF50',
  warning: '#FF9800',
  white: '#FFFFFF',
  surfaceMuted: '#F8F8F8',
  /** Semi-transparent overlay for modals and backdrops */
  overlay: 'rgba(0,0,0,0.40)',
  /** Drag handle / disabled dot color */
  handle: '#E0E0E0',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pageTop: 60,
  pageBottom: 40,
  cardGap: 14,
  sectionGap: 24,
} as const;

export const Radius = {
  xs: 3,
  sm: 8,
  sm2: 10,
  md: 12,
  md2: 14,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const FontSize = {
  xxs: 10,
  xs: 11,
  sm: 13,
  sm2: 14,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  title: 20,
  subtitle: 17,
} as const;

/** LunarCard secondary palette — traditional Chinese almanac brown/cream theme */
export const LunarColors = {
  bg: '#FFFBF0',
  border: '#E8D5B7',
  innerBg: '#FFFFFF',
  innerBorder: '#F0E6D3',
  text: '#8B4513',
  textSecondary: '#A0522D',
  dayNumber: '#D43F3F',
  yiText: '#C62828',
  yiBg: '#FFF0ED',
  yiBorder: '#FFCDD2',
  jiText: '#757575',
  jiBg: '#F5F5F5',
  jiBorder: '#E0E0E0',
  jieQiBg: '#FF6B35',
  jieQiText: '#FFFFFF',
  moreBtn: Colors.primary,
} as const;

export const Shadow = {
  card: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  /** Slightly stronger — for cards on tinted backgrounds that need more pop. */
  raised: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  prominent: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

// Shared card style — use this as base for all content cards
export const sharedCard = StyleSheet.create({
  base: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    ...Shadow.card,
  },
  /** Prominent card — for the core content users care about most */
  prominent: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    ...Shadow.prominent,
  },
});
