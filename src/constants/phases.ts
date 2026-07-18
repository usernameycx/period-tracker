export type Phase = 'period' | 'follicular' | 'ovulation' | 'luteal';

export const PHASE_LABELS: Record<Phase, string> = {
  period: '经期',
  follicular: '卵泡期',
  ovulation: '排卵期',
  luteal: '黄体期',
};

export const PHASE_EMOJI: Record<Phase, string> = {
  period: '🌸',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🌙',
};

export const DEFAULT_PERIOD_DAYS = 5;
export const DEFAULT_CYCLE_DAYS = 28;
export const OVULATION_BEFORE_PERIOD = 14;
export const OVULATION_SPAN = 3; // 排卵期共3天

export const MIN_RECORDS_FOR_PREDICTION = 2;
