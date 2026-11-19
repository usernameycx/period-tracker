import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Paths, File } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSettings } from '../../src/context/SettingsContext';
import CityPicker from '../../src/components/CityPicker';
import PressableScale from '../../src/components/PressableScale';
import TimeWheelPicker from '../../src/components/TimeWheelPicker';
import ConfirmModal from '../../src/components/ConfirmModal';
import OptionListModal from '../../src/components/OptionListModal';
import type { OptionItem } from '../../src/components/OptionListModal';
import { exportData, importData } from '../../src/utils/backup';
import { scheduleAllNotifications } from '../../src/services/notifications';
import { usePeriod } from '../../src/context/PeriodContext';
import { getDatabase } from '../../src/db/database';
import { getAllSymptoms, clearAllSymptoms, deleteSymptomByDate } from '../../src/db/symptoms';
import { buildCycleOptions, buildSymptomDayOptions, formatMonthDayWeek, formatFullDate } from '../../src/services/data-management';
import { getAveragePeriodDays } from '../../src/services/prediction';
import type { SymptomRecord } from '../../src/constants/symptoms';
import { seedDietRules } from '../../src/db/diet-rules';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../../src/constants/theme';
import Icon from '../../src/components/Icon';

export default function SettingsPage() {
  const { notifyHour, setNotifyHour, notifyMinute, setNotifyMinute, refresh: refreshSettings } = useSettings();
  const { refresh, clearAll, removeRecord, records } = usePeriod();
  const [symptomRows, setSymptomRows] = useState<SymptomRecord[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [notifyModal, setNotifyModal] = useState(false);
  const [busy, setBusy] = useState(false);
  // 数据管理：picker 选择 → confirm 二次确认 → 执行
  const [dataPicker, setDataPicker] = useState<'periods' | 'symptoms' | null>(null);
  const [pendingCycleKey, setPendingCycleKey] = useState<string | null>(null);
  const [pendingSymptomKey, setPendingSymptomKey] = useState<string | null>(null);
  const [symptomVersion, setSymptomVersion] = useState(0);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const loadSymptoms = useCallback(async () => {
    try {
      const db = await getDatabase();
      const rows = await getAllSymptoms(db);
      setSymptomRows(rows);
    } catch (e) {
      console.warn('symptom list fetch failed:', e);
    }
  }, []);

  // 进入页面即刷新：在日历页新增症状后切回来，这里的"天数"要立刻同步
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    loadSymptoms();
  }, [loadSymptoms]));

  useEffect(() => {
    loadSymptoms();
  }, [records, symptomVersion, loadSymptoms]);

  const symptomCount = symptomRows.length;

  const cycleOptions = useMemo<OptionItem[]>(() => {
    const cycles = buildCycleOptions(records, getAveragePeriodDays(records));
    if (cycles.length === 0) return [];
    return [
      {
        key: 'all',
        title: `全部周期（${cycles.length} 个）`,
        subtitle: '删除后阶段预测会重新计算',
        icon: 'cycle',
        danger: true,
      },
      ...cycles.map(c => ({
        key: `id:${c.id}`,
        title: c.label,
        subtitle: c.subtitle,
        icon: 'drop' as const,
        section: c.section,
      })),
    ];
  }, [records]);

  const symptomOptions = useMemo<OptionItem[]>(() => {
    const days = buildSymptomDayOptions(symptomRows);
    if (days.length === 0) return [];
    return [
      {
        key: 'all',
        title: `全部记录（${days.length} 天）`,
        subtitle: '想只删某一天，选下面的日期',
        icon: 'clipboard',
        danger: true,
      },
      ...days.map(d => ({
        key: `date:${d.date}`,
        title: d.label,
        subtitle: d.subtitle,
        icon: 'today' as const,
        section: d.section,
      })),
    ];
  }, [symptomRows]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleNotifyDone = async () => {
    setNotifyModal(false);
    await scheduleAllNotifications(notifyHour, notifyMinute).catch(e => {
      console.warn('scheduleAllNotifications failed:', e);
    });
  };

  // ── 删除经期记录：某个周期 / 全部 ──
  const executeDeleteCycle = async () => {
    const key = pendingCycleKey;
    setPendingCycleKey(null);
    if (!key) return;
    try {
      if (key === 'all') {
        await clearAll();
        setToast({ title: '已删除', message: '全部经期记录已删除' });
      } else {
        const id = Number(key.replace('id:', ''));
        const label = buildCycleOptions(records, getAveragePeriodDays(records)).find(o => o.id === id)?.label;
        await removeRecord(id);
        setToast({ title: '已删除', message: label ? `${label} 的周期已删除` : '该周期已删除' });
      }
    } catch (e: any) {
      setToast({ title: '操作失败', message: e.message || '请稍后再试' });
    }
  };

  // ── 删除症状记录：某一天 / 全部 ──
  const executeDeleteSymptom = async () => {
    const key = pendingSymptomKey;
    setPendingSymptomKey(null);
    if (!key) return;
    try {
      const db = await getDatabase();
      if (key === 'all') {
        await clearAllSymptoms(db);
        setToast({ title: '已删除', message: '全部症状记录已删除' });
      } else {
        const date = key.replace('date:', '');
        await deleteSymptomByDate(db, date);
        setToast({ title: '已删除', message: `${formatMonthDayWeek(date)} 的症状记录已删除` });
      }
      setSymptomVersion(v => v + 1);
    } catch (e: any) {
      setToast({ title: '操作失败', message: e.message || '请稍后再试' });
    }
  };

  const executeResetAll = async () => {
    setResetConfirm(false);
    try {
      const db = await getDatabase();
      await clearAll();
      await clearAllSymptoms(db);
      await db.runAsync('DELETE FROM diet_rules');
      await seedDietRules(db);
      setSymptomVersion(v => v + 1);
      await refresh();
      setToast({ title: '已重置', message: '所有数据已恢复为初始状态' });
    } catch (e: any) {
      setToast({ title: '操作失败', message: e.message || '请稍后再试' });
    }
  };

  const cycleConfirmMessage = () => {
    if (!pendingCycleKey) return '';
    if (pendingCycleKey === 'all') {
      return `将删除全部 ${records.length} 个经期周期，删除后阶段预测会重新计算。此操作不可恢复。`;
    }
    const id = Number(pendingCycleKey.replace('id:', ''));
    const target = buildCycleOptions(records).find(c => c.id === id);
    return target
      ? `确定删除 ${formatFullDate(target.startDate)} 起的这个周期吗？删除后阶段预测会重新计算，此操作不可恢复。`
      : '确定删除该周期吗？';
  };

  const symptomConfirmMessage = () => {
    if (!pendingSymptomKey) return '';
    if (pendingSymptomKey === 'all') {
      return `将删除全部 ${symptomCount} 天的症状记录，经期标记不受影响。此操作不可恢复。`;
    }
    const date = pendingSymptomKey.replace('date:', '');
    return `确定删除 ${formatMonthDayWeek(date)} 这一天的症状记录吗？经期标记与其他日期不受影响。`;
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const json = await exportData();
      const file = new File(Paths.cache, 'fayetide_backup.json');
      file.write(json);
      await shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'FayeTide 数据备份' });
      setToast({ title: '导出成功', message: '备份文件已保存' });
    } catch (e: any) {
      setToast({ title: '导出失败', message: e.message || '导出失败' });
    } finally {
      setBusy(false);
    }
  };
  const handleImport = () => setImportModalVisible(true);
  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      setBusy(true);
      const file = result.assets[0];
      const content = await (new File(file.uri)).text();
      await importData(content);
      await Promise.all([refresh(), refreshSettings()]);
      setImportModalVisible(false);
      setToast({ title: '导入完成', message: '数据已成功恢复' });
    } catch (e: any) {
      setToast({ title: '导入失败', message: e.message || '请检查文件格式' });
      setImportModalVisible(false);
    } finally {
      setBusy(false);
    }
  };
  const handleImportConfirm = async () => {
    if (!importText.trim()) return;
    setImportModalVisible(false);
    setBusy(true);
    try {
      await importData(importText.trim());
      await Promise.all([refresh(), refreshSettings()]);
      setImportText('');
      setToast({ title: '导入完成', message: '数据已成功恢复' });
    } catch (e: any) {
      setToast({ title: '导入失败', message: e.message || '请检查 JSON 格式' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        <PressableScale style={styles.rowItem} onPress={() => setDataPicker('periods')}>
          <View style={styles.rowIconBox}><Icon name="drop" size={16} color={Colors.primary} /></View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>删除经期记录</Text>
            <Text style={styles.rowHint}>{records.length} 个周期 · 可选择删某个或全部</Text>
          </View>
          <Icon name="chevron" size={16} color={Colors.textHint} />
        </PressableScale>
        <View style={styles.rowDivider} />
        <PressableScale style={styles.rowItem} onPress={() => setDataPicker('symptoms')}>
          <View style={styles.rowIconBox}><Icon name="clipboard" size={16} color={Colors.primary} /></View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>删除症状记录</Text>
            <Text style={styles.rowHint}>{symptomCount} 天 · 可选择删某天或全部</Text>
          </View>
          <Icon name="chevron" size={16} color={Colors.textHint} />
        </PressableScale>
      </View>

      {/* ── Danger zone ── */}
      <View style={styles.sectionHeader}>
        <Icon name="warning" size={14} color={Colors.danger} />
        <Text style={[styles.sectionTitle, { color: Colors.danger }]}>危险操作</Text>
      </View>
      <PressableScale style={styles.dangerRow} onPress={() => setResetConfirm(true)}>
        <View style={[styles.rowIconBox, { backgroundColor: Colors.dangerBg }]}><Icon name="warning" size={16} color={Colors.danger} /></View>
        <View style={styles.rowText}><Text style={styles.dangerTitle}>重置全部数据</Text><Text style={styles.rowHint}>经期 + 症状 + 饮食规则恢复默认</Text></View>
      </PressableScale>

      {/* ── Backup ── */}
      <View style={styles.sectionHeader}>
        <Icon name="export" size={14} color={Colors.textMuted} />
        <Text style={styles.sectionTitle}>数据备份</Text>
      </View>
      <View style={styles.backupRow}>
        <PressableScale style={styles.backupBtn} onPress={handleExport} disabled={busy}>
          {busy ? <ActivityIndicator size="small" color={Colors.white} /> :
            <><Icon name="export" size={16} color={Colors.white} /><Text style={styles.backupText}>导出 JSON</Text></>}
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

      {/* ── Legal ── */}
      <View style={styles.legalLinks}>
        <Text style={styles.legalLink}>隐私政策</Text>
        <Text style={styles.legalDivider}>·</Text>
        <Text style={styles.legalLink}>服务条款</Text>
      </View>

      {/* ── Notification Modal ── */}
      <Modal visible={notifyModal} transparent animationType="fade" onRequestClose={() => setNotifyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.notifyModalCard}>
            <Text style={styles.notifyModalTitle}>设置提醒时间</Text>
            <TimeWheelPicker hour={notifyHour} minute={notifyMinute} onHourChange={setNotifyHour} onMinuteChange={setNotifyMinute} />
            <PressableScale style={styles.notifyModalBtn} onPress={handleNotifyDone}>
              <Text style={styles.notifyModalBtnText}>完成</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>

      {/* ── 选择要删除的周期 ── */}
      <OptionListModal
        visible={dataPicker === 'periods'}
        title="删除经期记录"
        hint="选择一个周期单独删除，或删除全部"
        icon="drop"
        options={cycleOptions}
        actionLabel="删除所选"
        emptyText="还没有任何经期记录"
        onCancel={() => setDataPicker(null)}
        onConfirm={key => { setDataPicker(null); setPendingCycleKey(key); }}
      />

      {/* ── 选择要删除的症状日期 ── */}
      <OptionListModal
        visible={dataPicker === 'symptoms'}
        title="删除症状记录"
        hint="选择某一天的记录单独删除，或删除全部"
        icon="clipboard"
        options={symptomOptions}
        actionLabel="删除所选"
        emptyText="还没有任何症状记录"
        onCancel={() => setDataPicker(null)}
        onConfirm={key => { setDataPicker(null); setPendingSymptomKey(key); }}
      />

      {/* ── 删除确认 ── */}
      <ConfirmModal
        visible={pendingCycleKey !== null}
        title="删除经期记录"
        message={cycleConfirmMessage()}
        icon="warning"
        variant="danger"
        cancelLabel="取消"
        confirmLabel="确认删除"
        onCancel={() => setPendingCycleKey(null)}
        onConfirm={executeDeleteCycle}
      />
      <ConfirmModal
        visible={pendingSymptomKey !== null}
        title="删除症状记录"
        message={symptomConfirmMessage()}
        icon="warning"
        variant="danger"
        cancelLabel="取消"
        confirmLabel="确认删除"
        onCancel={() => setPendingSymptomKey(null)}
        onConfirm={executeDeleteSymptom}
      />
      <ConfirmModal
        visible={resetConfirm}
        title="重置全部数据"
        message={`将删除所有数据（${records.length} 个周期 + ${symptomCount} 天症状），并重置饮食规则为默认值。此操作不可恢复。`}
        icon="warning"
        variant="danger"
        cancelLabel="取消"
        confirmLabel="确认重置"
        onCancel={() => setResetConfirm(false)}
        onConfirm={executeResetAll}
      />

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
            <Text style={styles.importHint}>粘贴 JSON 数据，或直接选择备份文件</Text>
            <PressableScale style={styles.importFileBtn} onPress={handleImportFile}>
              <Icon name="export" size={16} color={Colors.primary} />
              <Text style={styles.importFileText}>从文件导入</Text>
            </PressableScale>
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
  importFileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.primaryLight, borderRadius: Radius.md, paddingVertical: Spacing.md, marginBottom: Spacing.lg, borderStyle: 'dashed' },
  importFileText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: Weight.bold },
  importBtns: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  importCancel: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  importCancelT: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: Weight.semibold },
  importConfirm: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  importConfirmT: { fontSize: FontSize.md, color: Colors.white, fontWeight: Weight.bold },

  /* Legal */
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  legalLink: { fontSize: FontSize.xs, color: Colors.textMuted },
  legalDivider: { fontSize: FontSize.xs, color: Colors.textMuted },
});
