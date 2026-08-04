import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useWeather } from '../context/WeatherContext';
import PressableScale from './PressableScale';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, } from '../constants/theme';
import Icon from './Icon';
import { isLocationAvailable, requestLocationPermission, getCurrentLocation } from '../services/location';

export default function CityPicker() {
  const { city, setCity } = useSettings();
  const { refresh } = useWeather();
  const [query, setQuery] = useState(city);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleSetCity = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) { setQuery(trimmed.slice(0, 20)); return; }
    if (!/^[\u4e00-\u9fa5a-zA-Z\s·]+$/.test(trimmed)) { setQuery(''); return; }
    setCity(trimmed);
    setQuery('');
    // 切换地区后立即自动刷新天气数据（WeatherContext 内部会显示 loading）
    refresh(trimmed);
  };

  /** 高德定位：成功后自动切换城市并刷新天气；失败保留最后一次正常数据 */
  const handleLocate = async () => {
    if (locating) return;
    if (!isLocationAvailable()) {
      setLocError('当前环境不支持定位（需 Android + 高德 SDK）');
      return;
    }
    setLocating(true);
    setLocError(null);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        setLocError('未获得定位权限，可在系统设置中开启');
        return;
      }
      const loc = await getCurrentLocation();
      if (!loc || !loc.city) {
        setLocError('定位失败，已保留当前城市数据');
        return;
      }
      setCity(loc.city);
      setQuery('');
      setLocError(null);
      // 自动刷新该地区天气
      refresh(loc.city);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <Icon name="location" size={15} color={Colors.primary} />
        </View>
        <Text style={styles.title}>天气城市</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder={city || '输入城市名'} placeholderTextColor={Colors.textHint} />
        <PressableScale style={styles.btn} onPress={handleSetCity}>
          <Text style={styles.btnText}>确认</Text>
        </PressableScale>
      </View>
      <PressableScale style={styles.locateBtn} onPress={handleLocate} disabled={locating}>
        {locating ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Icon name="location" size={14} color={Colors.primary} />
        )}
        <Text style={styles.locateText}>{locating ? '定位中…' : '使用当前位置定位'}</Text>
      </PressableScale>
      {locError && <Text style={styles.locError}>{locError}</Text>}
      <Text style={styles.current}>当前：{city}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    ...Shadow.card,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconWrap: {
    width: 28, height: 28, borderRadius: Radius.sm,
    backgroundColor: Colors.inkBg,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.subtitle, fontWeight: Weight.bold, color: Colors.text, flex: 1 },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.divider, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm2, color: Colors.text,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.sm,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
  },
  btnText: { color: Colors.white, fontWeight: Weight.bold, fontSize: FontSize.sm2 },
  locateBtn: {
    marginTop: Spacing.sm, alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: Radius.full,
    paddingVertical: 6, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryBg,
  },
  locateText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: Weight.semibold },
  locError: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.danger },
  current: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.textSecondary },
});
