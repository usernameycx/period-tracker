import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert, Platform, Modal, TextInput } from 'react-native';
import { useSettings } from '../../src/context/SettingsContext';
import CityPicker from '../../src/components/CityPicker';
import PressableScale from '../../src/components/PressableScale';
import TimeWheelPicker from '../../src/components/TimeWheelPicker';
import { exportData, importData } from '../../src/utils/backup';
import { usePeriod } from '../../src/context/PeriodContext';
import { getDatabase } from '../../src/db/database';
import { getSymptomCount, clearAllSymptoms } from '../../src/db/symptoms';
import { seedDietRules } from '../../src/db/diet-rules';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';
import Icon from '../../src/components/Icon';

export default function SettingsPage() {
  const { notifyHour, setNotifyHour, notifyMinute, setNotifyMinute, refresh: refreshSettings } = useSettings();
  const { refresh, clearAll, records } = usePeriod();
  const [symptomCount, setSymptomCount] = useState(0);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        const cnt = await getSymptomCount(db);
        setSymptomCount(cnt);
      } catch (e) {
        console.warn('symptomCount fetch failed:', e);
      }
    })();
  }, [records]);

  const handleClearPeriods = () => {
    Alert.alert('清除经期记录', `将删除 ${records.length} 条经期标记，症状记录和饮食规则不受影响`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定清除', style: 'destructive',
        onPress: async () => { await clearAll(); Alert.alert('已清除', '经期记录已删除'); },
      },
    ]);
  };

  const handleClearSymptoms = () => {
    Alert.alert('清除症状记录', `将删除 ${symptomCount} 条症状记录，经期标记不受影响`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定清除', style: 'destructive',
        onPress: async () => {
          const db = await getDatabase();
          await clearAllSymptoms(db);
          setSymptomCount(0);
          Alert.alert('已清除', '症状记录已删除');
        },
      },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert(
      '重置全部数据',
      `将删除所有数据（${records.length} 条经期 + ${symptomCount} 条症状），并重置饮食规则为默认值。此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认重置', style: 'destructive',
          onPress: async () => {
            const db = await getDatabase();
            await clearAll();
            await clearAllSymptoms(db);
            await db.runAsync('DELETE FROM diet_rules');
            await seedDietRules(db);
            setSymptomCount(0);
            await refresh();
            Alert.alert('已重置', '所有数据已恢复为初始状态');
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const json = await exportData();
      Alert.alert('导出成功', `数据已导出\n\n${json.slice(0, 200)}...`);
    } catch (e: any) {
      Alert.alert('导出失败', e.message || '导出失败，请稍后再试');
    }
  };

  const handleImport = () => {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('导入备份', '粘贴 JSON 数据', [
        { text: '取消', style: 'cancel' },
        {
          text: '导入',
          onPress: async (text: string | undefined) => {
            if (!text) return;
            try {
              await importData(text);
              await Promise.all([refresh(), refreshSettings()]);
              Alert.alert('导入完成', '数据已成功恢复');
            } catch (e: any) {
              Alert.alert('导入失败', e.message || '请检查 JSON 格式是否正确');
            }
          },
        },
      ]);
    } else {
      setImportModalVisible(true);
    }
  };

  const handleImportConfirm = async () => {
    if (!importText.trim()) return;
    try {
      await importData(importText.trim());
      await Promise.all([refresh(), refreshSettings()]);
      setImportText('');
      setImportModalVisible(false);
      Alert.alert('导入完成', '数据已成功恢复');
    } catch (e: any) {
      Alert.alert('导入失败', e.message || '请检查 JSON 格式是否正确');
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.pageTitleRow}>
        <View style={styles.titleIconWrap}>
          <Icon name="settings" size={22} color={Colors.primary} />
        </View>
        <Text style={styles.pageTitle}>设置</Text>
      </View>

      {/* Notification Time */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconDot, { backgroundColor: Colors.primaryBg }]}>
            <Icon name="bell" size={15} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>每日提醒时间</Text>
        </View>
        <TimeWheelPicker
          hour={notifyHour}
          minute={notifyMinute}
          onHourChange={setNotifyHour}
          onMinuteChange={setNotifyMinute}
        />
        <View style={styles.hintRow}>
          <Icon name="info" size={12} color={Colors.accentWarm} />
          <Text style={styles.hint}>每天早上 {pad(notifyHour)}:{pad(notifyMinute)} 推送当前经期阶段、天气与饮食建议</Text>
        </View>
      </View>

      <CityPicker />

      {/* Data Management */}
      <View style={styles.warmCard}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconDot, { backgroundColor: Colors.primaryBg }]}>
            <Icon name="backup" size={15} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>数据管理</Text>
        </View>

        <PressableScale style={styles.rowItem} onPress={handleClearPeriods}>
          <View style={styles.rowItemInner}>
            <View style={[styles.rowIconWrap, { backgroundColor: Colors.primaryBg }]}>
              <Icon name="drop" size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowItemTitle}>清除经期记录</Text>
              <Text style={styles.rowItemHint}>当前 {records.length} 条记录</Text>
            </View>
            <Icon name="chevron" size={16} color={Colors.accentWarm} />
          </View>
        </PressableScale>

        <View style={styles.rowDivider} />

        <PressableScale style={styles.rowItem} onPress={handleClearSymptoms}>
          <View style={styles.rowItemInner}>
            <View style={[styles.rowIconWrap, { backgroundColor: Colors.primaryBg }]}>
              <Icon name="clipboard" size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowItemTitle}>清除症状记录</Text>
              <Text style={styles.rowItemHint}>当前 {symptomCount} 条记录</Text>
            </View>
            <Icon name="chevron" size={16} color={Colors.accentWarm} />
          </View>
        </PressableScale>

        <View style={styles.rowDivider} />

        <PressableScale style={styles.rowItem} onPress={handleResetAll}>
          <View style={styles.rowItemInner}>
            <View style={[styles.rowIconWrap, { backgroundColor: Colors.dangerBg }]}>
              <Icon name="warning" size={16} color={Colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>重置全部数据</Text>
              <Text style={styles.rowItemHint}>经期 + 症状 + 饮食规则恢复默认</Text>
            </View>
            <Icon name="chevron" size={16} color={Colors.accentWarm} />
          </View>
        </PressableScale>
      </View>

      {/* Backup */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconDot, { backgroundColor: Colors.inkBg }]}>
            <Icon name="export" size={15} color={Colors.accentWarm} />
          </View>
          <Text style={styles.cardTitle}>数据备份</Text>
        </View>
        <View style={styles.backupRow}>
          <PressableScale style={styles.backupBtn} onPress={handleExport}>
            <View style={styles.backupBtnInner}>
              <Icon name="export" size={16} color={Colors.white} />
              <Text style={styles.backupText}>导出 JSON</Text>
            </View>
          </PressableScale>
          <PressableScale style={styles.importBtn} onPress={handleImport}>
            <View style={styles.importBtnInner}>
              <Icon name="import" size={16} color={Colors.accentWarm} />
              <Text style={styles.importText}>导入 JSON</Text>
            </View>
          </PressableScale>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <View style={styles.disclaimerHeader}>
          <Icon name="info" size={14} color={Colors.danger} />
          <Text style={styles.disclaimerTitle}>免责声明</Text>
        </View>
        <Text style={styles.disclaimerText}>
          本应用提供的经期预测和饮食建议仅供参考，不构成医疗建议。如有健康问题，请咨询专业医生。
        </Text>
      </View>

      {/* Import Modal (Android fallback) */}
      <Modal visible={importModalVisible} transparent animationType="fade" onRequestClose={() => setImportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>导入备份</Text>
            <Text style={styles.modalHint}>粘贴之前导出的 JSON 数据</Text>
            <TextInput
              style={styles.modalInput}
              value={importText}
              onChangeText={setImportText}
              placeholder='[{"start_date":"2026-01-01",...}]'
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <PressableScale style={styles.modalCancelBtn} onPress={() => { setImportText(''); setImportModalVisible(false); }}>
                <Text style={styles.modalCancelText}>取消</Text>
              </PressableScale>
              <PressableScale style={styles.modalConfirmBtn} onPress={handleImportConfirm}>
                <Text style={styles.modalConfirmText}>导入</Text>
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
  content: { paddingTop: Spacing.pageTop, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.pageBottom },

  /* Page title */
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  titleIconWrap: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.ink },

  /* White card */
  card: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.xl,
    marginBottom: Spacing.cardGap, ...Shadow.card,
  },

  /* Warm card */
  warmCard: {
    backgroundColor: Colors.surfaceWarm, borderRadius: Radius.lg, padding: Spacing.xl,
    marginBottom: Spacing.cardGap, borderWidth: 1, borderColor: Colors.inkBg, ...Shadow.raised,
  },

  /* Card title */
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconDot: {
    width: 28, height: 28, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: FontSize.subtitle, fontWeight: '700', color: Colors.text },

  /* Hint */
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  hint: { color: Colors.textMuted, fontSize: FontSize.sm },

  /* Data management rows */
  rowItem: { paddingVertical: 14 },
  rowItemInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowIconWrap: {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rowDivider: { height: 1, backgroundColor: Colors.inkBg },
  rowItemTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  rowItemHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  dangerTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.danger },

  /* Backup */
  backupRow: { flexDirection: 'row', gap: Spacing.md },
  backupBtn: { flex: 1 },
  backupBtnInner: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  backupText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  importBtn: { flex: 1 },
  importBtnInner: {
    backgroundColor: Colors.inkBg, borderRadius: Radius.md, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.accentWarm + '40',
  },
  importText: { color: Colors.accentWarm, fontWeight: '700', fontSize: FontSize.md },

  /* Disclaimer */
  disclaimer: {
    backgroundColor: Colors.dangerBg, borderRadius: Radius.md,
    padding: Spacing.lg, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.danger + '20',
  },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  disclaimerTitle: { fontSize: 14, fontWeight: '700', color: Colors.danger },
  disclaimerText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  /* Import Modal */
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.xxl, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  modalHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  modalInput: {
    borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: Radius.sm,
    padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text,
    minHeight: 120, marginBottom: Spacing.lg,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  modalCancelText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '600' },
  modalConfirmBtn: { backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  modalConfirmText: { fontSize: FontSize.md, color: Colors.white, fontWeight: '700' },
});
