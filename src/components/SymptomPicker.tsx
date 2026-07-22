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
    label: '经血量',
    options: [
      { key: 'light', label: '少量', icon: 'drop' as IconName, iconColor: Colors.textHint },
      { key: 'medium', label: '正常', icon: 'blood' as IconName, iconColor: Colors.primary },
      { key: 'heavy', label: '较多', icon: 'blood' as IconName, iconColor: Colors.danger },
    ],
  },
  {
    key: 'cramps' as const,
    label: '痛经',
    options: [
      { key: 'none', label: '无', icon: 'check' as IconName, iconColor: Colors.success },
      { key: 'mild', label: '轻微', icon: 'leaf' as IconName, iconColor: Colors.warning },
      { key: 'moderate', label: '中等', icon: 'warning' as IconName, iconColor: Colors.warning },
      { key: 'severe', label: '严重', icon: 'close' as IconName, iconColor: Colors.danger },
    ],
  },
  {
    key: 'mood' as const,
    label: '心情',
    options: [
      { key: 'happy', label: '开心', icon: 'sparkle' as IconName, iconColor: Colors.success },
      { key: 'calm', label: '平静', icon: 'moon' as IconName, iconColor: Colors.primary },
      { key: 'irritable', label: '烦躁', icon: 'warning' as IconName, iconColor: Colors.warning },
      { key: 'sad', label: '难过', icon: 'drop' as IconName, iconColor: Colors.primaryLight },
      { key: 'anxious', label: '焦虑', icon: 'lightning' as IconName, iconColor: Colors.warning },
    ],
  },
  {
    key: 'energy' as const,
    label: '精力',
    options: [
      { key: 'high', label: '充沛', icon: 'lightning' as IconName, iconColor: Colors.warning },
      { key: 'normal', label: '正常', icon: 'battery' as IconName, iconColor: Colors.success },
      { key: 'low', label: '疲惫', icon: 'moon' as IconName, iconColor: Colors.textHint },
    ],
  },
];

const TOGGLES = [
  { key: 'headache' as const, label: '头痛', icon: 'warning' as IconName, iconColor: Colors.warning },
  { key: 'bloating' as const, label: '腹胀', icon: 'drop' as IconName, iconColor: Colors.primary },
  { key: 'cravings' as const, label: '嘴馋', icon: 'diet' as IconName, iconColor: Colors.primary },
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
    const db = await getDatabase();
    await upsertSymptom(db, date, { [field]: value });
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
                    <Icon name={opt.icon} size={18} color={currentVal === opt.key ? Colors.primary : opt.iconColor} />
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
        <Text style={styles.catLabel}>其他</Text>
        <View style={styles.toggleRow}>
          {TOGGLES.map(t => {
            const val = data?.[t.key] === 1;
            return (
              <PressableScale
                key={t.key}
                style={[styles.toggle, val && styles.toggleActive]}
                onPress={() => update(t.key, val ? 0 : 1)}
              >
                <Icon name={t.icon} size={16} color={t.iconColor} />
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
  catLabel: { fontSize: FontSize.sm, fontWeight: Weight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  optionRow: { flexDirection: 'row', gap: Spacing.sm },
  option: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md, backgroundColor: Colors.cardBg,
  },
  optionActive: { backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primary },
  optionIcon: { marginBottom: 2 },
  optionLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.medium },
  optionLabelActive: { color: Colors.primary, fontWeight: Weight.bold },

  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggle: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.cardBg, gap: Spacing.xs,
  },
  toggleActive: { backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primary },
  toggleLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: Weight.medium },
  toggleLabelActive: { color: Colors.primary, fontWeight: Weight.bold },
  loadingSpinner: { marginTop: Spacing.md },
});
