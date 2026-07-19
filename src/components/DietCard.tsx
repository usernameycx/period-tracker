import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useCurrentPhase } from '../hooks/useCurrentPhase';
import { getDatabase } from '../db/database';
import { getDietRules, DietRule } from '../db/diet-rules';
import { Phase, PHASE_LABELS } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, sharedCard } from '../constants/theme';
import Icon from './Icon';

export default function DietCard() {
  const { records } = usePeriod();
  const phaseInfo = useCurrentPhase();
  const [diet, setDiet] = useState<DietRule | null>(null);

  useEffect(() => {
    (async () => {
      if (records.length === 0) return;
      const db = await getDatabase();
      const phase: Phase = phaseInfo?.phase || 'follicular';
      const dayOffset: number = phaseInfo?.dayOffset || 1;
      const rule = await getDietRules(db, phase, dayOffset);
      setDiet(rule);
    })();
  }, [records, phaseInfo]);

  if (!diet) {
    return (
      <View style={sharedCard.base}>
        <View style={styles.titleRow}>
          <Icon name="diet" size={18} color={Colors.accentWarm} />
          <Text style={styles.title}>今日饮食</Text>
        </View>
        <Text style={styles.empty}>暂无推荐数据，录入经期后可查看</Text>
      </View>
    );
  }

  return (
    <View style={sharedCard.base}>
      <View style={styles.titleRow}>
        <Icon name="diet" size={18} color={Colors.accentWarm} />
        <Text style={styles.title}>{PHASE_LABELS[diet.phase]} · 第{diet.day_offset}天 饮食建议</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Icon name="check" size={14} color={Colors.success} />
          <Text style={styles.label}>推荐多吃</Text>
        </View>
        <View style={styles.tagRow}>
          {diet.recommend.map((f, i) => (
            <View key={i} style={styles.recTag}><Text style={styles.recText}>{f}</Text></View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Icon name="close" size={14} color={Colors.danger} />
          <Text style={styles.label}>建议少吃</Text>
        </View>
        <View style={styles.tagRow}>
          {diet.avoid.map((f, i) => (
            <View key={i} style={styles.avoidTag}><Text style={styles.avoidText}>{f}</Text></View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, flex: 1 },
  section: { marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  label: { fontSize: FontSize.sm2, fontWeight: '600', color: Colors.textSecondary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  recTag: {
    backgroundColor: Colors.primaryBg, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  recText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  avoidTag: { backgroundColor: Colors.dangerBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  avoidText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '500' },
  empty: { color: Colors.textHint, fontSize: FontSize.sm2, textAlign: 'center', marginTop: Spacing.sm },
});
