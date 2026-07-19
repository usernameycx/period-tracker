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
import { Colors, Spacing, Radius, FontSize, Shadow, LunarColors } from '../constants/theme';
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

  // Animate in/out
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
      if (phaseInfo) {
        phase = phaseInfo.phase;
        dayOff = phaseInfo.dayOffset;
      }
      const rule = await getDietRules(db, phase, dayOff);
      if (!cancelled) setDiet(rule);
    })();
    return () => { cancelled = true; };
  }, [date, records, phaseInfo]);

  const handleToggle = async () => {
    if (recordedStart) {
      // Removing data is destructive — confirm before proceeding
      Alert.alert('取消标记', '确定要取消这天的经期标记吗？', [
        { text: '保留', style: 'cancel' },
        {
          text: '确定取消', style: 'destructive',
          onPress: async () => { await removeRecord(recordedStart.id); },
        },
      ]);
    } else {
      // Adding — validate cycle gap; surface clear error if too close to existing records
      try {
        await addRecord(dateStr);
      } catch (e: any) {
        Alert.alert('无法标记', e.message || '标记失败，请稍后再试');
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
              {/* Drag handle */}
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={styles.dateTitle}>{dateStr}</Text>

                {phaseInfo && (
                  <View style={styles.phaseBadge}>
                    <Icon name={PHASE_ICONS[phaseInfo.phase]} size={16} color={Colors.ink} />
                    <Text style={styles.phaseBadgeText}>
                      {PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天
                    </Text>
                  </View>
                )}

                {/* Toggle button */}
                <PressableScale
                  style={[styles.toggleBtn, recordedStart && styles.toggleBtnActive]}
                  onPress={handleToggle}
                >
                  <Icon name={recordedStart ? 'check' : 'blood'} size={16} color={recordedStart ? Colors.success : Colors.ink} />
                  <Text style={[styles.toggleText, recordedStart && styles.toggleTextActive]}>
                    {recordedStart ? '已标记为经期第一天（点击取消）' : '标记为经期第一天'}
                  </Text>
                </PressableScale>

                {recordedStart && (
                  <Text style={styles.hint}>
                    经期持续 {getAveragePeriodDays()} 天，其他时期将自动推算
                  </Text>
                )}

                {/* Diet for this day */}
                {diet && (
                  <View style={styles.dietSection}>
                    <View style={styles.dietTitleRow}>
                      <Icon name="diet" size={16} color={Colors.primary} />
                      <Text style={styles.dietTitle}>当日饮食</Text>
                    </View>
                    <View style={styles.dietLabelRow}>
                      <Icon name="check" size={14} color={Colors.success} />
                      <Text style={styles.dietSubtitle}>推荐</Text>
                    </View>
                    <View style={styles.dietChips}>
                      {diet.recommend.map((f, i) => (
                        <View key={`rec-${i}`} style={styles.dietChipRec}>
                          <Text style={styles.dietChipRecText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.dietLabelRow}>
                      <Icon name="close" size={14} color={Colors.danger} />
                      <Text style={[styles.dietSubtitle, styles.dietAvoidTitle]}>忌口</Text>
                    </View>
                    <View style={styles.dietChips}>
                      {diet.avoid.map((f, i) => (
                        <View key={`avo-${i}`} style={styles.dietChipAvo}>
                          <Text style={styles.dietChipAvoText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Symptom tracking */}
                <SymptomPicker date={dateStr} visible={visible} />

                {/* Weather advice */}
                {weather && phaseInfo && (
                  <View style={styles.adviceBox}>
                    <Icon name="bulb" size={16} color={Colors.warning} />
                    <Text style={styles.adviceText}>{getLifeAdvice(phaseInfo.phase, weather)}</Text>
                  </View>
                )}

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
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '82%',
    ...Shadow.card,
  },
  handleRow: { alignItems: 'center', paddingTop: Spacing.md },
  handle: { width: 36, height: 5, backgroundColor: Colors.handle, borderRadius: Radius.xs },
  scrollArea: { paddingTop: Spacing.xs },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 30 },

  dateTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  phaseBadge: {
    alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.lg,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  phaseBadgeText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  toggleBtn: {
    backgroundColor: Colors.primaryBg, borderRadius: Radius.lg, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, gap: Spacing.sm,
    borderWidth: 2, borderColor: Colors.primaryLight, borderStyle: 'dashed',
  },
  toggleBtnActive: { backgroundColor: Colors.primary, borderStyle: 'solid' },
  toggleText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.ink, textAlign: 'center' },
  toggleTextActive: { color: Colors.white },

  hint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md },

  dietSection: {
    marginTop: Spacing.md, backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md, padding: 14,
  },
  dietTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dietTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.ink },
  dietLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  dietSubtitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.success, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  dietAvoidTitle: { color: Colors.danger },
  dietChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  dietChipRec: {
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  dietChipRecText: { fontSize: FontSize.sm, color: Colors.ink, fontWeight: '500' },
  dietChipAvo: {
    backgroundColor: Colors.dangerBg, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: LunarColors.yiBorder,
  },
  dietChipAvoText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '500' },

  adviceBox: {
    marginTop: Spacing.md, backgroundColor: LunarColors.bg,
    borderRadius: Radius.md, padding: Spacing.cardGap,
    borderWidth: 1, borderColor: LunarColors.border,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
  },
  adviceText: { fontSize: FontSize.sm, color: LunarColors.text, lineHeight: 20, flex: 1 },

  closeBtn: {
    marginTop: Spacing.xl, alignSelf: 'center',
    paddingHorizontal: 32, paddingVertical: 10,
  },
  closeText: { fontSize: FontSize.md, color: Colors.textMuted },
});
