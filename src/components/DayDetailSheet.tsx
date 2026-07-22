import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableWithoutFeedback, ScrollView, StyleSheet, Modal, Animated, Dimensions, Alert } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useWeather } from '../context/WeatherContext';
import { getDatabase } from '../db/database';
import { getDietRules, DietRule } from '../db/diet-rules';
import { getPhaseForCalendarDay, getAveragePeriodDays } from '../services/prediction';
import { formatDate } from '../utils/date';
import { Phase, PHASE_LABELS, PHASE_ICONS } from '../constants/phases';
import { getLifeAdvice } from '../services/advice';
import PressableScale from './PressableScale';
import { Colors, Spacing, Radius, FontSize, Shadow, Weight, LineHeight } from '../constants/theme';
import Icon from './Icon';
import SymptomPicker from './SymptomPicker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  date: Date;
  onClose: () => void;
}

export default function DayDetailSheet({ visible, date, onClose }: Props) {
  const { records, addRecord, removeRecord } = usePeriod();
  const { weather } = useWeather();
  const [diet, setDiet] = useState<DietRule | null>(null);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const dateStr = formatDate(date);
  const recordedStart = records.find(r => r.start_date === dateStr);
  const phaseInfo = getPhaseForCalendarDay(date, records);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDatabase();
      if (cancelled) return;
      let phase: Phase = 'follicular';
      let dayOff = 1;
      if (phaseInfo) { phase = phaseInfo.phase; dayOff = phaseInfo.dayOffset; }
      const rule = await getDietRules(db, phase, dayOff);
      if (!cancelled) setDiet(rule);
    })();
    return () => { cancelled = true; };
  }, [date, records, phaseInfo]);

  const handleToggle = async () => {
    if (recordedStart) {
      Alert.alert('取消标记', '确定要取消这天的经期标记吗？', [
        { text: '保留', style: 'cancel' },
        { text: '确定取消', style: 'destructive', onPress: async () => { await removeRecord(recordedStart.id); } },
      ]);
    } else {
      try { await addRecord(dateStr); } catch (e: any) {
        Alert.alert('无法标记', e.message || '标记失败，请稍后再试');
      }
    }
  };

  const d = date;
  const m = `${d.getMonth() + 1}月${d.getDate()}日`;
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>

              <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false} bounces={false}>

                {/* Period status card */}
                <View style={styles.periodCard}>
                  <View style={styles.periodTop}>
                    <Text style={styles.dateTitle}>{m} 周{w}</Text>
                    {phaseInfo && (
                      <View style={styles.phaseBadge}>
                        <Icon name={PHASE_ICONS[phaseInfo.phase]} size={14} color={Colors.primary} />
                        <Text style={styles.phaseBadgeText}>{PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天</Text>
                      </View>
                    )}
                  </View>

                  <PressableScale
                    style={[styles.toggleBtn, recordedStart && styles.toggleBtnActive]}
                    onPress={handleToggle}
                  >
                    <Icon name={recordedStart ? 'check' : 'blood'} size={20} color={recordedStart ? Colors.success : Colors.primary} />
                    <Text style={[styles.toggleText, recordedStart && styles.toggleTextActive]}>
                      {recordedStart ? '已标记为经期第一天' : '标记为经期第一天'}
                    </Text>
                  </PressableScale>

                  {recordedStart && (
                    <Text style={styles.hint}>经期持续 {getAveragePeriodDays()} 天，其余阶段自动推算</Text>
                  )}
                </View>

                {diet ? (
                  <View style={styles.dietCard}>
                    <View style={styles.dietTitleRow}>
                      <Icon name="diet" size={16} color={Colors.botanical} />
                      <Text style={styles.dietTitle}>当日饮食</Text>
                    </View>
                    <View style={styles.dietChipRow}>
                      <View style={styles.chipIconRow}>
                        <Icon name="check" size={12} color={Colors.botanical} />
                        <Text style={styles.dietChipLabel}>推荐</Text>
                      </View>
                      <View style={styles.chipWrap}>
                        {diet.recommend.map((f, i) => (
                          <View key={`r${i}`} style={styles.chipRec}><Text style={styles.chipRecT}>{f}</Text></View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.dietChipRow}>
                      <View style={styles.chipIconRow}>
                        <Icon name="close" size={12} color={Colors.danger} />
                        <Text style={[styles.dietChipLabel, styles.dietChipLabelDanger]}>少吃</Text>
                      </View>
                      <View style={styles.chipWrap}>
                        {diet.avoid.map((f, i) => (
                          <View key={`a${i}`} style={styles.chipAvo}><Text style={styles.chipAvoT}>{f}</Text></View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.dietCard}>
                    <View style={styles.dietTitleRow}>
                      <Icon name="diet" size={16} color={Colors.botanical} />
                      <Text style={styles.dietTitle}>当日饮食</Text>
                    </View>
                    <View style={styles.dietPlaceholder}>
                      <Icon name="leaf" size={20} color={Colors.primaryLight} />
                      <Text style={styles.dietPlaceholderText}>记录经期后查看饮食建议</Text>
                    </View>
                  </View>
                )}

                <SymptomPicker date={dateStr} visible={visible} />

                {weather && phaseInfo && (() => {
                    const adv = getLifeAdvice(phaseInfo.phase, weather);
                    return (
                      <View style={styles.adviceBox}>
                        <Icon name="bulb" size={16} color={Colors.warning} />
                        <View style={styles.adviceContent}>
                          <Text style={styles.adviceWeather}>{adv.weatherAdvice}</Text>
                          <Text style={styles.advicePhase}>{adv.phaseAdvice}</Text>
                        </View>
                      </View>
                    );
                  })()}

                <PressableScale style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeText}>关闭</Text>
                </PressableScale>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '80%',
    minHeight: 300,
    ...Shadow.prominent,
  },

  handleRow: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  handle: { width: 40, height: 4, backgroundColor: Colors.handle, borderRadius: 2 },

  periodCard: {
    backgroundColor: Colors.primaryBg, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.primaryLight,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  periodTop: { alignItems: 'center', marginBottom: Spacing.md },

  dateTitle: { fontSize: FontSize.xl, fontWeight: Weight.extrabold, color: Colors.text, textAlign: 'center' },
  phaseBadge: {
    alignSelf: 'center', marginTop: Spacing.sm,
    backgroundColor: Colors.cardBg, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  phaseBadgeText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: Weight.semibold },

  toggleBtn: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primaryLight, borderStyle: 'dashed',
  },
  toggleBtnActive: { backgroundColor: Colors.botanicalBg, borderColor: Colors.success, borderStyle: 'solid' },
  toggleText: { fontSize: FontSize.base, fontWeight: Weight.bold, color: Colors.ink },
  toggleTextActive: { color: Colors.botanical },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  /* ── Scrollable ── */
  scrollArea: {},
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl },

  /* ── Diet ── */
  dietCard: { backgroundColor: Colors.botanicalBg, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  dietTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  dietTitle: { fontSize: FontSize.base, fontWeight: Weight.bold, color: Colors.ink },
  dietChipRow: { marginBottom: Spacing.sm },
  dietChipLabel: { fontSize: FontSize.sm, fontWeight: Weight.semibold, color: Colors.botanical, marginBottom: Spacing.xs },
  chipIconRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  dietChipLabelDanger: { color: Colors.danger },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chipRec: { backgroundColor: Colors.botanicalBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.botanical + '30' },
  chipRecT: { fontSize: FontSize.sm, color: Colors.botanical, fontWeight: Weight.semibold },
  chipAvo: { backgroundColor: Colors.dangerBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.danger + '30' },
  chipAvoT: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: Weight.medium },

  /* ── Advice ── */
  adviceBox: {
    marginTop: Spacing.sm, backgroundColor: Colors.primaryBg,
    borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
  },
  adviceContent: { flex: 1, gap: Spacing.xs },
  adviceWeather: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: LineHeight.sm2 },
  advicePhase: { fontSize: FontSize.sm, color: Colors.text, fontWeight: Weight.semibold, lineHeight: LineHeight.sm2 },

  dietPlaceholder: {
    backgroundColor: Colors.primaryBg, borderRadius: Radius.md,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
  },
  dietPlaceholderText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  closeBtn: {
    marginTop: Spacing.xl, alignSelf: 'center',
    backgroundColor: Colors.inkBg, borderRadius: Radius.full,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl,
  },
  closeText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: Weight.semibold },
});
