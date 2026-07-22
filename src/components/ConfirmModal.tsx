import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';
import type { IconName } from './Icon';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  icon?: IconName;
  variant?: 'default' | 'danger';
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  visible, title, message, icon,
  variant = 'default', cancelLabel = '取消', confirmLabel = '确定',
  onCancel, onConfirm,
}: Props) {
  const isDanger = variant === 'danger';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon && (
            <View style={[styles.iconWrap, isDanger && styles.iconWrapDanger]}>
              <Icon name={icon} size={28} color={isDanger ? Colors.danger : Colors.primary} />
            </View>
          )}
          <Text style={[styles.title, isDanger && styles.titleDanger]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.btnRow}>
            <PressableScale style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </PressableScale>
            <PressableScale style={[styles.confirmBtn, isDanger && styles.confirmBtnDanger]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  card: { backgroundColor: Colors.cardBg, borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center', width: '100%', maxWidth: 300, ...Shadow.prominent },
  iconWrap: { width: 56, height: 56, borderRadius: Radius.xl, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  iconWrapDanger: { backgroundColor: Colors.dangerBg },
  title: { fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm, lineHeight: LineHeight.lg },
  titleDanger: { color: Colors.danger },
  message: { fontSize: FontSize.sm2, color: Colors.textSecondary, textAlign: 'center', lineHeight: LineHeight.md, marginBottom: Spacing.xl },
  btnRow: { flexDirection: 'row', gap: Spacing.md, alignSelf: 'stretch' },
  cancelBtn: { flex: 1, backgroundColor: Colors.inkBg, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: Weight.semibold },
  confirmBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  confirmBtnDanger: { backgroundColor: Colors.danger },
  confirmText: { fontSize: FontSize.md, color: Colors.white, fontWeight: Weight.bold },
});
