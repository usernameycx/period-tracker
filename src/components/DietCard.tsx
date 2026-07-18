import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { getPhaseForDate, getNextPredictedStart, getAveragePeriodDays } from '../services/prediction';
import { getDatabase } from '../db/database';
import { getDietRules, DietRule } from '../db/diet-rules';
import { Phase } from '../constants/phases';
import { parseDate } from '../utils/date';

export default function DietCard() {
  const { records, loading } = usePeriod();
  const [diet, setDiet] = useState<DietRule | null>(null);

  useEffect(() => {
    (async () => {
      if (records.length === 0) return;
      const db = await getDatabase();
      const nextStart = getNextPredictedStart(records);
      const avgDays = getAveragePeriodDays(records);
      const today = new Date();

      let phase: Phase;
      let dayOffset: number;
      if (nextStart) {
        const info = getPhaseForDate(today, parseDate(nextStart), avgDays);
        phase = info.phase;
        dayOffset = info.dayOffset;
      } else {
        phase = 'follicular';
        dayOffset = 1;
      }

      const rule = await getDietRules(db, phase, dayOffset);
      setDiet(rule);
    })();
  }, [records]);

  if (!diet) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>🥗 今日饮食</Text>
        <Text style={styles.empty}>暂无推荐数据，录入经期后可查看</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🥗 今日饮食建议</Text>
      <View style={styles.section}>
        <Text style={styles.label}>✅ 推荐多吃</Text>
        <View style={styles.tagRow}>
          {diet.recommend.map((f, i) => (
            <View key={i} style={styles.recTag}><Text style={styles.recText}>{f}</Text></View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>❌ 建议少吃</Text>
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
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    shadowColor: '#FFB6C1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#FF69B4', marginBottom: 12 },
  section: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recTag: { backgroundColor: '#FFF0F3', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  recText: { fontSize: 13, color: '#FF69B4', fontWeight: '500' },
  avoidTag: { backgroundColor: '#FFF5F5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  avoidText: { fontSize: 13, color: '#E57373', fontWeight: '500' },
  empty: { color: '#BBB', fontSize: 14, textAlign: 'center', marginTop: 8 },
});
