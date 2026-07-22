import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Modal, TextInput } from 'react-native';
import { useSettings } from '../../src/context/SettingsContext';
import CityPicker from '../../src/components/CityPicker';
import PressableScale from '../../src/components/PressableScale';
import TimeWheelPicker from '../../src/components/TimeWheelPicker';
import ConfirmModal from '../../src/components/ConfirmModal';
import { exportData, importData } from '../../src/utils/backup';
import { usePeriod } from '../../src/context/PeriodContext';
import { getDatabase } from '../../src/db/database';
import { getSymptomCount, clearAllSymptoms } from '../../src/db/symptoms';
import { seedDietRules } from '../../src/db/diet-rules';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../../src/constants/theme';
import Icon from '../../src/components/Icon';

export default function SettingsPage() {
  const { notifyHour, setNotifyHour, notifyMinute, setNotifyMinute, refresh: refreshSettings } = useSettings();
  const { refresh, clearAll, records } = usePeriod();
  const [symptomCount, setSymptomCount] = useState(0);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [notifyModal, setNotifyModal] = useState(false);

  type ConfirmType = 'clearPeriods' | 'clearSymptoms' | 'resetAll' | null;
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      try { const db = await getDatabase(); setSymptomCount(await getSymptomCount(db)); }
      catch (e) { console.warn('symptomCount fetch failed:', e); }
    })();
  }, [records]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const handleClearPeriods = () => setConfirmType('clearPeriods');
  const handleClearSymptoms = () => setConfirmType('clearSymptoms');
  const handleResetAll = () => setConfirmType('resetAll');

  const executeConfirm = async () => {
    const type = confirmType; setConfirmType(null);
    if (!type) return;
    try {
      if (type === 'clearPeriods') { await clearAll(); setToast({ title: '已清除', message: '经期记录已删除' }); }
      else if (type === 'clearSymptoms') { const db = await getDatabase(); await clearAllSymptoms(db); setSymptomCount(0); setToast({ title: '已清除', message: '症状记录已删除' }); }
      else if (type === 'resetAll') { const db = await getDatabase(); await clearAll(); await clearAllSymptoms(db); await db.runAsync('DELETE FROM diet_rules'); await seedDietRules(db); setSymptomCount(0); await refresh(); setToast({ title: '已重置', message: '所有数据已恢复为初始状态' }); }
    } catch (e: any) { setToast({ title: '操作失败', message: e.message || '请稍后再试' }); }
  };

  const getConfirmConfig = () => {
    switch (confirmType) {
      case 'clearPeriods': return { title: '清除经期记录', message: `将删除 ${records.length} 条经期标记，症状记录和饮食规则不受影响`, icon: 'drop' as const };
      case 'clearSymptoms': return { title: '清除症状记录', message: `将删除 ${symptomCount} 条症状记录，经期标记不受影响`, icon: 'clipboard' as const };
      case 'resetAll': return { title: '重置全部数据', message: `将删除所有数据（${records.length} 条经期 + ${symptomCount} 条症状），并重置饮食规则为默认值。此操作不可恢复。`, icon: 'warning' as const, variant: 'danger' as const };
      default: return null;
    }
  };

  const handleExport = async () => {
    try { const json = await exportData(); setToast({ title: '导出成功', message: json.slice(0, 200) + '...' }); }
    catch (e: any) { setToast({ title: '导出失败', message: e.message || '导出失败' }); }
  };
  const handleImport = () => setImportModalVisible(true);
  const handleImportConfirm = async () => {
    if (!importText.trim()) return;
    try { await importData(importText.trim()); await Promise.all([refresh(), refreshSettings()]); setImportText(''); setImportModalVisible(false); setToast({ title: '导入完成', message: '数据已成功恢复' }); }
    catch (e: any) { setToast({ title: '导入失败', message: e.message || '请检查 JSON 格式' }); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Page title */}
      <View style={styles.pageTitleRow}>
        <View style={styles.titleIconWrap}><Icon name="settings" size={22} color={Colors.primary} /></View>
        <Text style={styles.pageTitle}>设置</Text>
      </View>

      {/* ── Notification ── */}
      <PressableScale style={styles.notifyRow} onPress={() => setNotifyModal(true)}>
        <View style={styles.notifyIconWrap}><Icon name="bell" size={20} color={Colors.primary} /></View>
        <View style={styles.notifyTextWrap}>
          <Text style={styles.notifyTitle}>每日提醒</Text>
          <Text style={styles.notifySubtitle}>每天 {pad(notifyHour)}:{pad(notifyMinute)} · 点击修改</Text>
        </View>
        <Icon name="chevron" size={16} color={Colors.textHint} />
      </PressableScale>

      <CityPicker />

      {/* ── Data management ── */}
      <View style={styles.sectionHeader}>
        <Icon name="backup" size={14} color={Colors.textMuted} />
        <Text style={styles.sectionTitle}>数据管理</Text>
      </View>
      <View style={styles.card}>
        <PressableScale style={styles.rowItem} onPress={handleClearPeriods}>
          <View style={styles.rowIconBox}><Icon name="drop" size={16} color={Colors.primary} /></View>
          <View style={styles.rowText}><Text style={styles.rowTitle}>清除经期记录</Text><Text style={styles.rowHint}>{records.length} 条记录</Text></View>
        </PressableScale>
        <View style={styles.rowDivider} />
        <PressableScale style={styles.rowItem} onPress={handleClearSymptoms}>
          <View style={styles.rowIconBox}><Icon name="clipboard" size={16} color={Colors.primary} /></View>
          <View style={styles.rowText}><Text style={styles.rowTitle}>清除症状记录</Text><Text style={styles.rowHint}>{symptomCount} 条记录</Text></View>
        </PressableScale>
      </View>

      {/* ── Danger zone ── */}
      <View style={styles.sectionHeader}>
        <Icon name="warning" size={14} color={Colors.danger} />
        <Text style={[styles.sectionTitle, { color: Colors.danger }]}>危险操作</Text>
      </View>
      <PressableScale style={styles.dangerRow} onPress={handleResetAll}>
        <View style={[styles.rowIconBox, { backgroundColor: Colors.dangerBg }]}><Icon name="warning" size={16} color={Colors.danger} /></View>
        <View style={styles.rowText}><Text style={styles.dangerTitle}>重置全部数据</Text><Text style={styles.rowHint}>经期 + 症状 + 饮食规则恢复默认</Text></View>
      </PressableScale>

      {/* ── Backup ── */}
      <View style={styles.sectionHeader}>
        <Icon name="export" size={14} color={Colors.textMuted} />
        <Text style={styles.sectionTitle}>数据备份</Text>
      </View>
      <View style={styles.backupRow}>
        <PressableScale style={styles.backupBtn} onPress={handleExport}>
          <Icon name="export" size={16} color={Colors.white} /><Text style={styles.backupText}>导出 JSON</Text>
        </PressableScale>
        <PressableScale style={styles.importBtn} onPress={handleImport}>
          <Icon name="import" size={16} color={Colors.primary} /><Text style={styles.importText}>导入 JSON</Text>
        </PressableScale>
      </View>

      {/* ── Disclaimer ── */}
      <View style={styles.disclaimer}>
        <View style={styles.disclaimerHeader}>
          <Icon name="info" size={14} color={Colors.danger} /><Text style={styles.disclaimerTitle}>免责声明</Text>
        </View>
        <Text style={styles.disclaimerText}>本应用提供的经期预测和饮食建议仅供参考，不构成医疗建议。如有健康问题，请咨询专业医生。</Text>
      </View>

      {/* ── Notification Modal ── */}
      <Modal visible={notifyModal} transparent animationType="fade" onRequestClose={() => setNotifyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.notifyModalCard}>
            <Text style={styles.notifyModalTitle}>设置提醒时间</Text>
            <TimeWheelPicker hour={notifyHour} minute={notifyMinute} onHourChange={setNotifyHour} onMinuteChange={setNotifyMinute} />
            <PressableScale style={styles.notifyModalBtn} onPress={() => setNotifyModal(false)}>
              <Text style={styles.notifyModalBtnText}>完成</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>

      {/* ── Confirm ── */}
      {(() => { const c = getConfirmConfig(); if (!c) return null; return (
        <ConfirmModal visible={confirmType !== null} title={c.title} message={c.message}
          icon={c.icon} variant={'variant' in c ? c.variant : 'default'}
          confirmLabel={confirmType === 'resetAll' ? '确认重置' : '确定清除'}
          onCancel={() => setConfirmType(null)} onConfirm={executeConfirm} />
      ); })()}

      {/* ── Toast ── */}
      <Modal visible={toast !== null} transparent animationType="fade" onRequestClose={() => setToast(null)}>
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <Icon name="check" size={24} color={Colors.success} />
            <Text style={styles.toastTitle}>{toast?.title}</Text>
            <Text style={styles.toastMessage}>{toast?.message}</Text>
            <PressableScale style={styles.toastBtn} onPress={() => setToast(null)}>
              <Text style={styles.toastBtnText}>知道了</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>

      {/* ── Import Modal ── */}
      <Modal visible={importModalVisible} transparent animationType="fade" onRequestClose={() => setImportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.importCard}>
            <Text style={styles.importTitle}>导入备份</Text>
            <Text style={styles.importHint}>粘贴之前导出的 JSON 数据</Text>
            <TextInput style={styles.importInput} value={importText} onChangeText={setImportText}
              placeholder='[{"start_date":"2026-01-01",...}]' multiline textAlignVertical="top" />
            <View style={styles.importBtns}>
              <PressableScale style={styles.importCancel} onPress={() => { setImportText(''); setImportModalVisible(false); }}>
                <Text style={styles.importCancelT}>取消</Text>
              </PressableScale>
              <PressableScale style={styles.importConfirm} onPress={handleImportConfirm}>
                <Text style={styles.importConfirmT}>导入</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: Spacing.pageTop, paddingHorizontal: Spacing.pageH, paddingBottom: Spacing.pageBottom },

  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  titleIconWrap: { backgroundColor: Colors.primaryBg, borderRadius: Radius.lg, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: Weight.bold, color: Colors.ink },

  /* ── Notification row ── */
  notifyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.cardGap, ...Shadow.card,
  },
  notifyIconWrap: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  notifyTextWrap: { flex: 1 },
  notifyTitle: { fontSize: FontSize.base, fontWeight: Weight.bold, color: Colors.text },
  notifySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

  /* ── Notification modal ── */
  notifyModalCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center', width: '100%', maxWidth: 320, ...Shadow.prominent },
  notifyModalTitle: { fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.text, marginBottom: Spacing.lg },
  notifyModalBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, marginTop: Spacing.lg },
  notifyModalBtnText: { color: Colors.white, fontWeight: Weight.bold, fontSize: FontSize.base },

  /* ── Section ── */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: Weight.bold, color: Colors.textMuted },

  card: { backgroundColor: Colors.cardBg, borderRadius: Radius.xl, ...Shadow.card, marginBottom: Spacing.cardGap, overflow: 'hidden' },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  rowIconBox: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: Weight.semibold, color: Colors.text },
  rowHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 36 + Spacing.md + Spacing.xl },

  dangerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.cardGap, ...Shadow.card,
  },
  dangerTitle: { fontSize: FontSize.md, fontWeight: Weight.semibold, color: Colors.danger },

  backupRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.cardGap },
  backupBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  backupText: { color: Colors.white, fontWeight: Weight.bold, fontSize: FontSize.md },
  importBtn: { flex: 1, backgroundColor: Colors.inkBg, borderRadius: Radius.lg, paddingVertical: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  importText: { color: Colors.primary, fontWeight: Weight.bold, fontSize: FontSize.md },

  disclaimer: { backgroundColor: Colors.dangerBg, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.sm },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  disclaimerTitle: { fontSize: FontSize.sm2, fontWeight: Weight.bold, color: Colors.danger },
  disclaimerText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: LineHeight.sm2 },

  /* ── Modal shared ── */
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },

  /* ── Toast ── */
  toastOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  toastCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center', width: '100%', maxWidth: 280, ...Shadow.prominent },
  toastTitle: { fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.text, marginTop: Spacing.md },
  toastMessage: { fontSize: FontSize.sm2, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl, lineHeight: LineHeight.md },
  toastBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl },
  toastBtnText: { color: Colors.white, fontWeight: Weight.bold, fontSize: FontSize.md },

  /* ── Import ── */
  importCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.xxl, padding: Spacing.xxl, width: '100%', maxWidth: 360 },
  importTitle: { fontSize: FontSize.xl, fontWeight: Weight.extrabold, color: Colors.text, marginBottom: Spacing.sm },
  importHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  importInput: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text, minHeight: 120, marginBottom: Spacing.lg },
  importBtns: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  importCancel: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  importCancelT: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: Weight.semibold },
  importConfirm: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  importConfirmT: { fontSize: FontSize.md, color: Colors.white, fontWeight: Weight.bold },
});
