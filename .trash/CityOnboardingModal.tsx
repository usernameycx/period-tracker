import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Modal } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';

export default function CityOnboardingModal() {
  const { city, setCity } = useSettings();
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState(city);

  useEffect(() => {
    setInput(city);
  }, [city]);

  const handleConfirm = () => {
    const trimmed = input.trim();
    if (trimmed) {
      setCity(trimmed);
      setVisible(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="location" size={44} color={Colors.primary} />
          </View>
          <Text style={styles.title}>设置你的城市</Text>
          <Text style={styles.subtitle}>用于获取当地天气，帮你更好地安排日常</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="输入城市名，如：南昌"
            placeholderTextColor={Colors.textHint}
            autoFocus
          />
          <PressableScale style={styles.btn} onPress={handleConfirm}>
            <Text style={styles.btnText}>开始使用</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xxl,
    padding: Spacing.xxxl,
    width: '100%',
    alignItems: 'center',
    ...Shadow.prominent,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: Weight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm2,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
    textAlign: 'center',
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxxl,
  },
  btnText: {
    color: Colors.white,
    fontWeight: Weight.bold,
    fontSize: FontSize.base,
  },
});
