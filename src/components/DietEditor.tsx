import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { getDatabase } from '../db/database';
import { getAllDietRules, updateDietRule, resetDietRulesToDefault, DietRule } from '../db/diet-rules';
import { PHASE_LABELS, Phase } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, Weight, } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';

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
        <View style={styles.titleRow}>
          <Icon name="diet" size={18} color={Colors.primary} />
          <Text style={styles.title}>饮食规则编辑</Text>
        </View>
        <PressableScale onPress={handleReset}>
          <Text style={styles.reset}>恢复默认</Text>
        </PressableScale>
      </View>

      {grouped.map(g => (
        <View key={g.phase} style={styles.group}>
          <Text style={styles.phaseTitle}>{g.label}</Text>
          {g.items.map(r => (
            <PressableScale key={r.id} style={styles.ruleRow} onPress={() => startEdit(r)}>
              <Text style={styles.dayLabel}>第{r.day_offset}天</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.dietInlineRow}>
                  <Icon name="check" size={12} color={Colors.success} />
                  <Text style={styles.rec} numberOfLines={1}>{r.recommend.join('、')}</Text>
                </View>
                <View style={styles.dietInlineRow}>
                  <Icon name="close" size={12} color={Colors.danger} />
                  <Text style={styles.av} numberOfLines={1}>{r.avoid.join('、')}</Text>
                </View>
              </View>
              <Icon name="edit" size={14} color={Colors.textHint} />
            </PressableScale>
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
            <PressableScale style={styles.cancelBtn} onPress={() => setEditingId(null)}>
              <Text style={styles.cancelText}>取消</Text>
            </PressableScale>
            <PressableScale style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveText}>保存</Text>
            </PressableScale>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.cardGap },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  title: { fontSize: FontSize.subtitle, fontWeight: Weight.bold, color: Colors.primary },
  reset: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: Weight.semibold },
  group: { marginBottom: Spacing.md },
  phaseTitle: { fontSize: FontSize.md, fontWeight: Weight.semibold, color: Colors.primary, marginBottom: Spacing.sm },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.primaryBg },
  dayLabel: { width: 50, fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: Weight.semibold },
  rec: { fontSize: FontSize.xs, color: Colors.primary },
  av: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 2 },
  dietInlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editPanel: { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.sm },
  editTitle: { fontSize: FontSize.lg, fontWeight: Weight.bold, color: Colors.primary, marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: Radius.sm, padding: Spacing.md, fontSize: FontSize.sm2, color: Colors.text, minHeight: 50, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.md },
  cancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  cancelText: { color: Colors.textMuted, fontWeight: Weight.semibold },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xxl },
  saveText: { color: Colors.white, fontWeight: Weight.bold },
});
