import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';
import type { IconName } from './Icon';

const ONBOARDING_DONE_KEY = 'onboarding_done_v1';

// 图标按功能语义选取，风格统一（描边线性图标）
const STEPS: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'drop',
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
    title: '自动定位',
    desc: '启动时自动定位所在城市\n获取当地天气与生活建议',
  },
  {
    icon: 'bell',
    title: '确保准时通知',
    desc: '为不错过每日提醒\n请开启「自启动」权限',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then(v => {
      if (!v) setVisible(true);
    }).catch(() => {});
  }, []);

  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  const finish = async () => {
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
  const isLast = step === STEPS.length - 1;
  const isAutoStartStep = step === STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <View style={styles.iconInner}>
              <Icon name={s.icon} size={30} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.title}>{s.title}</Text>
          {isAutoStartStep ? (
            <View style={styles.autoStartWrap}>
              <Text style={styles.desc}>{s.desc}</Text>
              <PressableScale style={styles.settingBtn} onPress={openAppSettings}>
                <Icon name="settings" size={16} color={Colors.primary} />
                <Text style={styles.settingBtnText}>打开系统设置</Text>
              </PressableScale>
              <Text style={styles.hint}>
                设置 → 应用 → FayeTide → 自启动 / 省电策略 → 允许
              </Text>
            </View>
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
              {isLast ? '开始使用' : '下一步'}
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
    justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.xxxl, alignItems: 'center', width: '100%', maxWidth: 320,
    ...Shadow.card,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.primaryBg,
    borderWidth: 2, borderColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconInner: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.raised,
  },
  title: { fontSize: FontSize.xl, fontWeight: Weight.extrabold, color: Colors.text, marginBottom: Spacing.sm },
  desc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: LineHeight.base },
  autoStartWrap: { alignItems: 'center', width: '100%' },
  settingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.xl, borderWidth: 2, borderColor: Colors.primaryLight,
    borderRadius: Radius.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  settingBtnText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: Weight.bold },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xxl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.divider },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  btn: {
    marginTop: Spacing.xxl, backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, paddingHorizontal: 40,
  },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: Weight.bold },
  skipBtn: { marginTop: Spacing.md, padding: Spacing.sm },
  skipText: { color: Colors.textHint, fontSize: FontSize.sm },
});
