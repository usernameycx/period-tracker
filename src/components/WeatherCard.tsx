import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable } from 'react-native';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import { useCurrentPhase } from '../hooks/useCurrentPhase';
import { getLifeAdvice } from '../services/advice';
import PressableScale from './PressableScale';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
import Icon from './Icon';

export default function WeatherCard() {
  const { weather, loading, error, refresh } = useWeather();
  const { city, setCity } = useSettings();
  const phaseInfo = useCurrentPhase();
  const [cityModal, setCityModal] = useState(false);
  const [cityInput, setCityInput] = useState('');

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.hero}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonBar, { width: '40%', height: 28 }]} />
            <View style={[styles.skeletonBar, { width: '60%', height: 14 }]} />
          </View>
        </View>
        <View style={styles.metrics}>
          {[1,2,3].map(i => <View key={i} style={[styles.skeletonBar, { flex: 1, height: 32 }]} />)}
        </View>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyWrap}>
          <Icon name="weather" size={28} color={Colors.textHint} />
          <Text style={styles.emptyText}>{error ?? '暂无天气数据'}</Text>
          <Pressable style={styles.retryBtn} onPress={refresh}>
            <Icon name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const feelsDiff = Math.abs(weather.feelsLike - weather.temperature);
  const showFeelsLike = feelsDiff >= 2;

  // Wind level (Beaufort scale, km/h)
  const windKmh = weather.windSpeed ?? 0;
  const windLevel = windKmh < 2 ? 0 : windKmh < 6 ? 1 : windKmh < 12 ? 2 : windKmh < 20 ? 3 : windKmh < 29 ? 4 : windKmh < 39 ? 5 : 6;
  const windColor = windLevel <= 1 ? Colors.success : windLevel <= 3 ? Colors.primary : Colors.warning;
  const windLabel = windLevel === 0 ? '微风' : windLevel <= 2 ? '轻风' : windLevel <= 4 ? '和风' : '强风';

  return (
    <View style={styles.card}>
      {/* Location + Date bar */}
      <View style={styles.locRow}>
        <PressableScale style={styles.locPill} onPress={() => { setCityInput(city); setCityModal(true); }}>
          <Icon name="location" size={10} color={Colors.primary} />
          <Text style={styles.locText}>{city}</Text>
        </PressableScale>
        <Text style={styles.dateText}>{new Date().getMonth() + 1}月{new Date().getDate()}日</Text>
      </View>

      {/* Hero: icon + temp */}
      <View style={styles.hero}>
        <Text style={styles.emoji}>{weather.icon}</Text>
        <View style={styles.heroContent}>
          <View style={styles.tempRow}>
            <Text style={styles.temp}>{weather.temperature}°</Text>
            {showFeelsLike && <Text style={styles.feels}>体感 {weather.feelsLike}°</Text>}
          </View>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>
      </View>

      {/* Advice */}
      <View style={styles.advice}>
        <Icon name={phaseInfo ? 'sparkle' : 'bulb'} size={14} color={phaseInfo ? Colors.primary : Colors.textHint} />
        {phaseInfo ? (
          <Text style={styles.adviceText}>{getLifeAdvice(phaseInfo.phase, weather)}</Text>
        ) : (
          <Text style={styles.advicePlaceholder}>记录经期后查看阶段生活建议</Text>
        )}
      </View>

      {/* Metrics */}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <View style={[styles.metricIcon, { backgroundColor: Colors.warning + '18' }]}>
            <Icon name="sun" size={16} color={Colors.warning} />
          </View>
          <Text style={styles.metricVal}>UV{weather.uvIndex}</Text>
          <Text style={styles.metricLabel}>紫外线</Text>
        </View>
        <View style={styles.metric}>
          <View style={[styles.metricIcon, { backgroundColor: Colors.primary + '18' }]}>
            <Icon name="drop" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.metricVal}>{weather.humidity}%</Text>
          <Text style={styles.metricLabel}>湿度</Text>
        </View>
        <View style={styles.metric}>
          <View style={[styles.metricIcon, { backgroundColor: windColor + '22' }]}>
            <Icon name="wind" size={16} color={windColor} />
          </View>
          <Text style={styles.metricVal}>{windLevel}级</Text>
          <Text style={styles.metricLabel}>{windLabel}</Text>
        </View>
      </View>

      {/* City edit modal */}
      <Modal visible={cityModal} transparent animationType="fade" onRequestClose={() => setCityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>切换城市</Text>
            <TextInput
              style={styles.modalInput}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="输入城市名"
              placeholderTextColor={Colors.textHint}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <PressableScale style={styles.modalCancel} onPress={() => setCityModal(false)}>
                <Text style={styles.modalCancelT}>取消</Text>
              </PressableScale>
              <PressableScale style={styles.modalConfirm} onPress={() => {
                const t = cityInput.trim();
                if (t) { setCity(t); refresh(); }
                setCityModal(false);
              }}>
                <Text style={styles.modalConfirmT}>确认</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.cardGap,
    ...Shadow.card,
  },

  /* ── Location ── */
  /* ── Location row ── */
  locRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  locPill: { backgroundColor: Colors.primaryBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: Weight.semibold },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* ── Hero ── */
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  emoji: { fontSize: 48 },
  heroContent: { flex: 1, gap: 2 },
  tempRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  temp: { fontSize: 40, fontWeight: Weight.extrabold, color: Colors.primary, letterSpacing: -2 },
  feels: { fontSize: FontSize.xs, color: Colors.textMuted },
  condition: { fontSize: FontSize.sm2, color: Colors.textSecondary, marginTop: 2 },

  /* ── Advice ── */
  advice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  adviceText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: LineHeight.sm2 },
  advicePlaceholder: { flex: 1, fontSize: FontSize.sm, color: Colors.textHint },

  /* ── Metrics ── */
  metrics: { flexDirection: 'row', gap: Spacing.sm },
  metric: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  metricIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  metricVal: { fontSize: FontSize.md, fontWeight: Weight.bold, color: Colors.ink },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* ── Empty / Loading ── */
  emptyWrap: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm2 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primaryLight },
  retryText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: Weight.semibold },
  skeletonIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.inkBg },
  skeletonBar: { backgroundColor: Colors.inkBg, borderRadius: Radius.xs, opacity: 0.5 },
  skeletonContent: { flex: 1, gap: 6 },
  heroContent: { flex: 1 },

  /* ── City modal ── */
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  modalCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.xxl, padding: Spacing.xxl, width: '100%', maxWidth: 300, ...Shadow.prominent },
  modalTitle: { fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  modalCancel: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  modalCancelT: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: Weight.semibold },
  modalConfirm: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xxl },
  modalConfirmT: { fontSize: FontSize.md, color: Colors.white, fontWeight: Weight.bold },
});
