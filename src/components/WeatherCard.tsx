import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';
import { useCurrentPhase } from '../hooks/useCurrentPhase';
import { getLifeAdvice } from '../services/advice';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';
import Icon from './Icon';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function WeatherCard() {
  const { weather, loading, error } = useWeather();
  const { city } = useSettings();
  const phaseInfo = useCurrentPhase();

  const d = new Date();
  const todayStr = `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`;

  if (loading) {
    return (
      <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
        <ActivityIndicator color={Colors.accentWarm} />
        <Text style={styles.loadingText}>获取天气中...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
        <Text style={styles.errorText}>{error ?? '暂无天气数据'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Hero: big emoji + temp */}
      <View style={styles.hero}>
        <Text style={styles.weatherEmoji}>{weather.icon}</Text>
        <View style={styles.heroText}>
          <Text style={styles.temp}>{weather.temperature}°</Text>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.cityBadge}>
            <Icon name="location" size={10} color={Colors.primary} />
            <Text style={styles.cityText}>{city}</Text>
          </View>
          <Text style={styles.dateText}>{todayStr}</Text>
        </View>
      </View>

      {/* Divider with accent dot */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDot} />
        <View style={styles.dividerLine} />
      </View>

      {/* Weather advice */}
      <View style={styles.adviceRow}>
        <View style={styles.adviceIconWrap}>
          <Icon name="bulb" size={14} color={Colors.warning} />
        </View>
        <Text style={styles.advice}>{weather.advice}</Text>
      </View>

      {/* Phase life advice */}
      {phaseInfo && (
        <View style={styles.phaseAdvice}>
          <Icon name="sparkle" size={14} color={Colors.accentWarm} />
          <Text style={styles.phaseAdviceText}>{getLifeAdvice(phaseInfo.phase, weather)}</Text>
        </View>
      )}

      {/* Detail rows — stacked vertically so long text is never clipped */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Icon name="sun" size={16} color={Colors.warning} />
          </View>
          <View style={styles.detailBody}>
            <View style={styles.detailHead}>
              <Text style={styles.detailLabel}>紫外线</Text>
              <Text style={styles.detailValue}>UV {weather.uvIndex}</Text>
            </View>
            <Text style={styles.detailSub}>{weather.uvAdvice}</Text>
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Icon name="drop" size={16} color={Colors.accentWarm} />
          </View>
          <View style={styles.detailBody}>
            <View style={styles.detailHead}>
              <Text style={styles.detailLabel}>湿度</Text>
              <Text style={styles.detailValue}>{weather.humidity}%</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    borderWidth: 1,
    borderColor: Colors.inkBg,
    ...Shadow.raised,
  },

  /* Hero */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherEmoji: {
    fontSize: 48,
    lineHeight: 52,
    marginRight: Spacing.md,
  },
  heroText: {
    flex: 1,
  },
  temp: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.accentWarm,
    letterSpacing: -1,
  },
  condition: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  heroRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  cityBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  cityText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.inkBg,
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accentWarm,
    marginHorizontal: Spacing.sm,
  },

  /* Advice */
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  adviceIconWrap: {
    backgroundColor: Colors.warning + '18',
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    marginTop: 1,
  },
  advice: {
    fontSize: FontSize.sm2,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },

  /* Phase advice */
  phaseAdvice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  phaseAdviceText: {
    fontSize: FontSize.sm,
    color: Colors.ink,
    lineHeight: 20,
    flex: 1,
  },

  /* Detail section — vertical stack, full width, no text clipping */
  detailsSection: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  detailIconWrap: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  detailBody: {
    flex: 1,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.ink,
  },
  detailSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },

  loadingText: { marginTop: Spacing.sm, color: Colors.textMuted, fontSize: FontSize.sm },
  errorText: { color: Colors.textMuted, fontSize: FontSize.sm2 },
});
