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

export const DEFAULT_PERIOD_DAYS = 7;
export const DEFAULT_CYCLE_DAYS = 28;
export const OVULATION_BEFORE_PERIOD = 14;
export const OVULATION_SPAN = 3; // 排卵期共3天

export const MIN_RECORDS_FOR_PREDICTION = 2;

/** Calendar cell background colors for each phase */
export const PHASE_COLORS: Record<Phase, string> = {
  period: '#FFB6C1',
  follicular: '#80CBC4',
  ovulation: '#B39DDB',
  luteal: '#FFD54F',
};
