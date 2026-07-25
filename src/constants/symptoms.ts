export interface SymptomRecord {
  id: number;
  date: string;
  flow: string | null;
  cramps: string | null;
  mood: string | null;
  energy: string | null;
  headache: number;
  bloating: number;
  cravings: number;
  backPain: number;
  breastPain: number;
  skinSensitive: number;
  notes: string | null;
  created_at: string;
}

export const FLOW_OPTIONS = [
  { key: 'light', label: '少量', emoji: '💧' },
  { key: 'medium', label: '正常', emoji: '🩸' },
  { key: 'heavy', label: '较多', emoji: '🩸🩸' },
] as const;

export const CRAMPS_OPTIONS = [
  { key: 'none', label: '无', emoji: '😊' },
  { key: 'mild', label: '轻微', emoji: '🙂' },
  { key: 'moderate', label: '中等', emoji: '😣' },
  { key: 'severe', label: '严重', emoji: '😫' },
] as const;

export const MOOD_OPTIONS = [
  { key: 'happy', label: '开心', emoji: '😄' },
  { key: 'calm', label: '平静', emoji: '😌' },
  { key: 'irritable', label: '烦躁', emoji: '😤' },
  { key: 'sad', label: '难过', emoji: '😢' },
  { key: 'anxious', label: '焦虑', emoji: '😰' },
] as const;

export const ENERGY_OPTIONS = [
  { key: 'high', label: '充沛', emoji: '⚡' },
  { key: 'normal', label: '正常', emoji: '🔋' },
  { key: 'low', label: '疲惫', emoji: '🪫' },
] as const;

export const YES_NO_OPTIONS = [
  { key: 'no', label: '无', emoji: '✅' },
  { key: 'yes', label: '有', emoji: '⚠️' },
] as const;

export function getFlowLabel(key: string): string {
  return FLOW_OPTIONS.find(o => o.key === key)?.label || key;
}

export function getCrampsLabel(key: string): string {
  return CRAMPS_OPTIONS.find(o => o.key === key)?.label || key;
}

export function getMoodLabel(key: string): string {
  return MOOD_OPTIONS.find(o => o.key === key)?.label || key;
}
