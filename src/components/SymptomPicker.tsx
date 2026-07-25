import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getDatabase } from '../db/database';
import { getSymptomByDate, upsertSymptom } from '../db/symptoms';
import { SymptomRecord } from '../constants/symptoms';
import { Colors, Spacing, Radius, FontSize, Weight, } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';
import type { IconName } from './Icon';

interface Props {
  date: string;
  visible: boolean;
}

const CATEGORIES = [
  {
    key: 'flow' as const,
    label: '出血量',
    options: [
      { key: 'light', label: '少量', icon: 'droplet' as IconName, iconColor: Colors.textHint },
      { key: 'medium', label: '正常', icon: 'drop' as IconName, iconColor: Colors.primary },
      { key: 'heavy', label: '较多', icon: 'drops' as IconName, iconColor: Colors.danger },
    ],
  },
  {
    key: 'cramps' as const,
    label: '小腹不适感',
    options: [
      { key: 'none', label: '无', icon: 'check-circle' as IconName, iconColor: Colors.success },
      { key: 'mild', label: '轻微', icon: 'wave' as IconName, iconColor: Colors.primary },
      { key: 'moderate', label: '中等', icon: 'zigzag' as IconName, iconColor: Colors.warning },
      { key: 'severe', label: '严重', icon: 'lightning' as IconName, iconColor: Colors.danger },
    ],
  },
  {
    key: 'mood' as const,
    label: '今日心情',
    options: [
      { key: 'happy', label: '开心', icon: 'smile' as IconName, iconColor: Colors.success },
      { key: 'calm', label: '平静', icon: 'zen' as IconName, iconColor: Colors.primary },
      { key: 'irritable', label: '烦躁', icon: 'storm' as IconName, iconColor: Colors.warning },
      { key: 'sad', label: '难过', icon: 'frown' as IconName, iconColor: Colors.primaryLight },
      { key: 'anxious', label: '焦虑', icon: 'nervous' as IconName, iconColor: Colors.warning },
    ],
  },
  {
    key: 'energy' as const,
    label: '精力状态',
    options: [
      { key: 'high', label: '充沛', icon: 'battery-full' as IconName, iconColor: Colors.warning },
      { key: 'normal', label: '正常', icon: 'battery' as IconName, iconColor: Colors.success },
      { key: 'low', label: '疲惫', icon: 'battery-low' as IconName, iconColor: Colors.textHint },
    ],
  },
];

const TOGGLES = [
  { key: 'headache' as const, label: '头痛', icon: 'head' as IconName, iconColor: Colors.danger },
  { key: 'bloating' as const, label: '腹胀', icon: 'bloat' as IconName, iconColor: Colors.primaryLight },
  { key: 'cravings' as const, label: '嘴馋', icon: 'cookie' as IconName, iconColor: Colors.primary },
  { key: 'backPain' as const, label: '腰痛', icon: 'backPain' as IconName, iconColor: Colors.primaryLight },
  { key: 'breastPain' as const, label: '胸胀', icon: 'breastPain' as IconName, iconColor: Colors.danger },
  { key: 'skinSensitive' as const, label: '眼干', icon: 'eyeDry' as IconName, iconColor: Colors.primary },
];

export default function SymptomPicker({ date, visible }: Props) {
  const [data, setData] = useState<SymptomRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const db = await getDatabase();
      const row = await getSymptomByDate(db, date);
      if (!cancelled) {
        setData(row);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [date, visible]);

  const update = async (field: string, value: string | number) => {
    setData(prev => {
      const updated = { ...(prev || {} as SymptomRecord), [field]: value } as SymptomRecord;
      return updated;
    });
    try {
      const db = await getDatabase();
      await upsertSymptom(db, date, { [field]: value });
    } catch (e) {
      console.warn('SymptomPicker.update failed:', e);
    }
  };

  if (!visible) return null;
  if (loading) return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Icon name="clipboard" size={18} color={Colors.primary} />
        <Text style={styles.title}>记录症状</Text>
      </View>
      <ActivityIndicator color={Colors.primary} style={styles.loadingSpinner} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Icon name="clipboard" size={18} color={Colors.primary} />
        <Text style={styles.title}>记录症状</Text>
      </View>

      {CATEGORIES.map((cat, idx) => {
        const currentVal = data?.[cat.key] as string | null;
        return (
          <View key={cat.key}>
            {idx > 0 && <View style={styles.catDivider} />}
            <View style={styles.category}>
              <Text style={styles.catLabel}>{cat.label}</Text>
              <View style={styles.optionRow}>
                {cat.options.map(opt => (
                  <PressableScale
                    key={opt.key}
                    style={[styles.option, currentVal === opt.key && styles.optionActive]}
                    onPress={() => update(cat.key, opt.key)}
                  >
                    <Icon name={opt.icon} size={20} color={currentVal === opt.key ? Colors.primary : opt.iconColor} />
                    <Text style={[styles.optionLabel, currentVal === opt.key && styles.optionLabelActive]}>
                      {opt.label}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </View>
          </View>
        );
      })}

      {/* Toggles section */}
      <View style={styles.catDivider} />
      <View style={styles.category}>
        <Text style={styles.catLabel}>其他身体症状</Text>
        <View style={styles.toggleRow}>
          {TOGGLES.map(t => {
            const val = data?.[t.key] === 1;
            return (
              <PressableScale
                key={t.key}
                style={[styles.toggle, val && styles.toggleActive]}
                onPress={() => update(t.key, val ? 0 : 1)}
              >
                <Icon name={t.icon} size={20} color={t.iconColor} />
                <Text style={[styles.toggleLabel, val && styles.toggleLabelActive]}>{t.label}</Text>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: Weight.bold, color: Colors.primary },
  category: { marginBottom: Spacing.md },
  catDivider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
  catLabel: { fontSize: FontSize.sm2, fontWeight: Weight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  optionRow: { flexDirection: 'row', gap: Spacing.sm },
  option: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md, backgroundColor: Colors.cardBg,
  },
  optionActive: { backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primary },
  optionIcon: { marginBottom: 2 },
  optionLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: Weight.medium },
  optionLabelActive: { color: Colors.primary, fontWeight: Weight.bold },

  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  toggle: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, borderRadius: Radius.md,
    backgroundColor: Colors.cardBg, gap: Spacing.xs, minWidth: 70,
  },
  toggleActive: { backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primary },
  toggleLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: Weight.medium },
  toggleLabelActive: { color: Colors.primary, fontWeight: Weight.bold },
  loadingSpinner: { marginTop: Spacing.md },
});
