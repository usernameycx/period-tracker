import type { IconName } from '../components/Icon';

export type Phase = 'period' | 'follicular' | 'ovulation' | 'luteal';

export const PHASE_LABELS: Record<Phase, string> = {
  period: '经期',
  follicular: '卵泡期',
  ovulation: '排卵期',
  luteal: '黄体期',
};

export const PHASE_ICONS: Record<Phase, IconName> = {
  period: 'blood',
  follicular: 'leaf',
  ovulation: 'egg',
  luteal: 'today',
};

export const DEFAULT_PERIOD_DAYS = 5;
export const DEFAULT_CYCLE_DAYS = 28;
export const OVULATION_BEFORE_PERIOD = 14;
export const OVULATION_SPAN = 1; // 排卵日精确1天（黄体期恢复14天）
export const FERTILITY_WINDOW = 3; // 日历备孕窗口（排卵日±1天，仅影响日历颜色）

export const MIN_RECORDS_FOR_PREDICTION = 2;

/** Calendar cell background colors for each phase */
export const PHASE_COLORS: Record<Phase, string> = {
  period: '#F2D5C5',
  follicular: '#D6E4D0',
  ovulation: '#EDE0C8',
  luteal: '#E6DBD5',
};
export const FERTILITY_COLOR = '#F5EDE0'; // 备孕窗口浅色（比排卵更浅）
