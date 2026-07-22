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
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  card: { backgroundColor: Colors.cardBg, borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center', width: '100%', maxWidth: 310, ...Shadow.prominent, overflow: 'hidden' },
  iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  iconWrapDanger: { backgroundColor: Colors.dangerBg },
  title: { fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs, lineHeight: LineHeight.lg },
  titleDanger: { color: Colors.danger },
  message: { fontSize: FontSize.sm2, color: Colors.textSecondary, textAlign: 'center', lineHeight: LineHeight.md, marginBottom: Spacing.xl },
  btnRow: { flexDirection: 'row', gap: Spacing.md, alignSelf: 'stretch' },
  cancelBtn: { flex: 1, backgroundColor: Colors.inkBg, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.divider },
  cancelText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: Weight.medium },
  confirmBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', ...Shadow.raised },
  confirmBtnDanger: { backgroundColor: Colors.danger },
  confirmText: { fontSize: FontSize.md, color: Colors.white, fontWeight: Weight.bold },
});
