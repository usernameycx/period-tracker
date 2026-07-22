import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import PressableScale from './PressableScale';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, } from '../constants/theme';
import Icon from './Icon';

export default function CityPicker() {
  const { city, setCity } = useSettings();
  const [query, setQuery] = useState(city);

  const handleSetCity = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) { setQuery(trimmed.slice(0, 20)); return; }
    if (!/^[\u4e00-\u9fa5a-zA-Z\s·]+$/.test(trimmed)) { setQuery(''); return; }
    setCity(trimmed);
    setQuery('');
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
  current: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.textSecondary },
});
