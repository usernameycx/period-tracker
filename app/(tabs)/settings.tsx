import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSettings } from '../../src/context/SettingsContext';
import CityPicker from '../../src/components/CityPicker';
import DietEditor from '../../src/components/DietEditor';
import { exportData, importData } from '../../src/utils/backup';
import { usePeriod } from '../../src/context/PeriodContext';

export default function SettingsPage() {
  const { notifyHour, setNotifyHour, notifyMinute, setNotifyMinute } = useSettings();
  const { refresh } = usePeriod();

  const handleExport = async () => {
    try {
      const json = await exportData();
      Alert.alert('导出成功', `数据已导出\n\n${json.slice(0, 200)}...`);
    } catch (e: any) {
      Alert.alert('导出失败', e.message);
    }
  };

  const handleImport = () => {
    Alert.alert('导入备份', '请将之前导出的 JSON 粘贴到下方（实际使用中可通过文件选择）', [
      { text: '取消', style: 'cancel' },
      { text: '模拟导入', onPress: async () => { await importData('{}'); refresh(); Alert.alert('导入完成'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>⚙️ 设置</Text>

      {/* Notification Time */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔔 每日提醒时间</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity onPress={() => setNotifyHour(Math.max(0, notifyHour - 1))}>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{String(notifyHour).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => setNotifyHour(Math.min(23, notifyHour + 1))}>
            <Text style={styles.arrow}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.colon}>:</Text>
          <TouchableOpacity onPress={() => setNotifyMinute(Math.max(0, notifyMinute - 10))}>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{String(notifyMinute).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => setNotifyMinute(Math.min(50, notifyMinute + 10))}>
            <Text style={styles.arrow}>▲</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>每天早上 {String(notifyHour).padStart(2, '0')}:{String(notifyMinute).padStart(2, '0')} 推送天气 + 饮食提醒</Text>
      </View>

      <CityPicker />

      {/* Backup */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💾 数据备份</Text>
        <View style={styles.backupRow}>
          <TouchableOpacity style={styles.backupBtn} onPress={handleExport}>
            <Text style={styles.backupText}>导出 JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backupBtn, styles.importBtn]} onPress={handleImport}>
            <Text style={styles.backupText}>导入 JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DietEditor />

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>📋 免责声明</Text>
        <Text style={styles.disclaimerText}>
          本应用提供的经期预测和饮食建议仅供参考，不构成医疗建议。如有健康问题，请咨询专业医生。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#FF69B4', marginBottom: 18 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#FF69B4', marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  arrow: { fontSize: 14, color: '#FF69B4', padding: 8 },
  time: { fontSize: 36, fontWeight: '700', color: '#333', fontVariant: ['tabular-nums'] },
  colon: { fontSize: 36, fontWeight: '700', color: '#333' },
  hint: { textAlign: 'center', color: '#999', fontSize: 13, marginTop: 10 },
  backupRow: { flexDirection: 'row', gap: 12 },
  backupBtn: { flex: 1, backgroundColor: '#FF69B4', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importBtn: { backgroundColor: '#FFB6C1' },
  backupText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  disclaimer: { backgroundColor: '#FFF0F3', borderRadius: 12, padding: 16, marginTop: 8 },
  disclaimerTitle: { fontSize: 14, fontWeight: '700', color: '#E57373', marginBottom: 6 },
  disclaimerText: { fontSize: 13, color: '#999', lineHeight: 20 },
});
