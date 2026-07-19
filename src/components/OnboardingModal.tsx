import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';
import type { IconName } from './Icon';

const ONBOARDING_DONE_KEY = 'onboarding_done_v1';

const STEPS: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'calendar',
    title: '记录经期',
    desc: '在日历页点击日期，标记经期第一天\n我们会自动推算后续阶段',
  },
  {
    icon: 'cycle',
    title: '查看周期',
    desc: '今日页显示当前阶段、倒计时和饮食建议\n每天下拉刷新获取最新天气',
  },
  {
    icon: 'clipboard',
    title: '记录症状',
    desc: '点击日历日期可记录经血量、痛经、心情等\n长期追踪了解身体规律',
  },
  {
    icon: 'location',
    title: '设置城市',
    desc: '用于获取当地天气和生活建议',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { city, setCity } = useSettings();
  const [cityInput, setCityInput] = useState(city);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then(v => {
      if (!v) setVisible(true);
    }).catch(() => {});
  }, []);

  const finish = async () => {
    const trimmed = cityInput.trim();
    if (trimmed) setCity(trimmed);
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const skip = () => finish();

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name={s.icon} size={56} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{s.title}</Text>
          {step === 3 ? (
            <TextInput
              style={styles.cityInput}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="输入城市名，如：南昌"
              placeholderTextColor={Colors.textHint}
              autoFocus
            />
          ) : (
            <Text style={styles.desc}>{s.desc}</Text>
          )}

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <PressableScale style={styles.btn} onPress={next}>
            <Text style={styles.btnText}>
              {step < STEPS.length - 1 ? '下一步' : '开始使用'}
            </Text>
          </PressableScale>

          <PressableScale onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>跳过</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  card: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: 32, alignItems: 'center', width: '100%', maxWidth: 320,
    ...Shadow.card,
  },
  iconWrap: { marginBottom: 16 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  desc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 24 },
  cityInput: {
    width: '100%', borderWidth: 2, borderColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.base, textAlign: 'center', color: Colors.text,
    marginTop: Spacing.md, marginBottom: Spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.divider },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  btn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  skipBtn: { marginTop: 12, padding: 8 },
  skipText: { color: Colors.textHint, fontSize: FontSize.sm },
});
