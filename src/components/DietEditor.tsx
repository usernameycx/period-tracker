import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getDatabase } from '../db/database';
import { getAllDietRules, updateDietRule, resetDietRulesToDefault, DietRule } from '../db/diet-rules';
import { PHASE_LABELS, Phase } from '../constants/phases';

const PHASE_ORDER: Phase[] = ['period', 'follicular', 'ovulation', 'luteal'];

export default function DietEditor() {
  const [rules, setRules] = useState<DietRule[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [recInput, setRecInput] = useState('');
  const [avInput, setAvInput] = useState('');

  const load = async () => {
    const db = await getDatabase();
    const all = await getAllDietRules(db);
    setRules(all);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (r: DietRule) => {
    setEditingId(r.id);
    setRecInput(r.recommend.join('、'));
    setAvInput(r.avoid.join('、'));
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const db = await getDatabase();
    const rec = recInput.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
    const av = avInput.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
    await updateDietRule(db, editingId, rec, av);
    setEditingId(null);
    load();
  };

  const handleReset = () => {
    Alert.alert('恢复默认', '将重置所有饮食规则到默认值，自定义修改会丢失', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: async () => { await resetDietRulesToDefault(await getDatabase()); load(); }, style: 'destructive' },
    ]);
  };

  const grouped = PHASE_ORDER.map(p => ({
    phase: p,
    label: PHASE_LABELS[p],
    items: rules.filter(r => r.phase === p),
  }));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🍽️ 饮食规则编辑</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.reset}>恢复默认</Text>
        </TouchableOpacity>
      </View>

      {grouped.map(g => (
        <View key={g.phase} style={styles.group}>
          <Text style={styles.phaseTitle}>{g.label}</Text>
          {g.items.map(r => (
            <TouchableOpacity key={r.id} style={styles.ruleRow} onPress={() => startEdit(r)}>
              <Text style={styles.dayLabel}>第{r.day_offset}天</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rec} numberOfLines={1}>✅ {r.recommend.join('、')}</Text>
                <Text style={styles.av} numberOfLines={1}>❌ {r.avoid.join('、')}</Text>
              </View>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {editingId !== null && (
        <View style={styles.editPanel}>
          <Text style={styles.editTitle}>编辑饮食规则</Text>
          <Text style={styles.inputLabel}>推荐食物（用、分隔）</Text>
          <TextInput style={styles.input} value={recInput} onChangeText={setRecInput} multiline />
          <Text style={styles.inputLabel}>忌口食物（用、分隔）</Text>
          <TextInput style={styles.input} value={avInput} onChangeText={setAvInput} multiline />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: '#FF69B4' },
  reset: { fontSize: 13, color: '#E57373', fontWeight: '600' },
  group: { marginBottom: 14 },
  phaseTitle: { fontSize: 15, fontWeight: '600', color: '#FF69B4', marginBottom: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FFF0F3' },
  dayLabel: { width: 50, fontSize: 13, color: '#999', fontWeight: '600' },
  rec: { fontSize: 12, color: '#FF69B4' },
  av: { fontSize: 12, color: '#E57373', marginTop: 2 },
  editIcon: { fontSize: 14, paddingLeft: 8 },
  editPanel: { backgroundColor: '#FFF5F7', borderRadius: 12, padding: 16, marginTop: 8 },
  editTitle: { fontSize: 16, fontWeight: '700', color: '#FF69B4', marginBottom: 12 },
  inputLabel: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#FFD1DC', borderRadius: 10, padding: 10, fontSize: 14, color: '#333', minHeight: 50, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  cancelText: { color: '#999', fontWeight: '600' },
  saveBtn: { backgroundColor: '#FF69B4', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 24 },
  saveText: { color: '#FFF', fontWeight: '700' },
});
