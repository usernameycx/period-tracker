import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useWeather } from '../context/WeatherContext';
import { getDatabase } from '../db/database';
import { getDietRules, DietRule } from '../db/diet-rules';
import { getPhaseForDate, getNextPredictedStart, getAveragePeriodDays } from '../services/prediction';
import { parseDate, formatDate } from '../utils/date';
import { Phase, PHASE_LABELS, PHASE_EMOJI } from '../constants/phases';
import { getLifeAdvice } from '../services/advice';

interface Props {
  visible: boolean;
  date: Date;
  onClose: () => void;
}

export default function DayDetailSheet({ visible, date, onClose }: Props) {
  const { records, addRecord, updateRecord, removeRecord } = usePeriod();
  const { weather } = useWeather();
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [existingRecord, setExistingRecord] = useState<{ id: number; start: string; end: string } | null>(null);
  const [diet, setDiet] = useState<DietRule | null>(null);

  const dateStr = formatDate(date);

  useEffect(() => {
    let cancelled = false;
    setStartInput(dateStr);
    setEndInput(dateStr);
    // Check existing record
    const rec = records.find(r => {
      const s = parseDate(r.start_date);
      const e = parseDate(r.end_date);
      return date >= s && date <= e;
    });
    if (rec) {
      setExistingRecord({ id: rec.id, start: rec.start_date, end: rec.end_date });
      setStartInput(rec.start_date);
      setEndInput(rec.end_date);
    } else {
      setExistingRecord(null);
    }

    // Load diet
    (async () => {
      const db = await getDatabase();
      if (cancelled) return;
      const next = getNextPredictedStart(records);
      const avg = getAveragePeriodDays(records);
      let phase: Phase;
      let dayOff: number;
      if (next) {
        const info = getPhaseForDate(date, parseDate(next), avg);
        phase = info.phase;
        dayOff = info.dayOffset;
      } else {
        phase = 'follicular';
        dayOff = 1;
      }
      const rule = await getDietRules(db, phase, dayOff);
      if (!cancelled) setDiet(rule);
    })();

    return () => { cancelled = true; };
  }, [date, records]);

  const handleSave = async () => {
    if (existingRecord) {
      await updateRecord(existingRecord.id, startInput, endInput);
    } else {
      await addRecord(startInput, endInput);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (existingRecord) {
      await removeRecord(existingRecord.id);
    }
    onClose();
  };

  const phaseInfo = (() => {
    const next = getNextPredictedStart(records);
    const avg = getAveragePeriodDays(records);
    if (next) return getPhaseForDate(date, parseDate(next), avg);
    return { phase: 'follicular' as Phase, dayOffset: 1 };
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.dateTitle}>{dateStr}</Text>
          <Text style={styles.phase}>{PHASE_EMOJI[phaseInfo.phase]} {PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天</Text>

          {/* Period Entry */}
          <Text style={styles.label}>经期录入</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>开始:</Text>
            <TextInput style={styles.input} value={startInput} onChangeText={setStartInput} placeholder="YYYY-MM-DD" />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>结束:</Text>
            <TextInput style={styles.input} value={endInput} onChangeText={setEndInput} placeholder="YYYY-MM-DD" />
          </View>

          <View style={styles.btnRow}>
            {existingRecord && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteText}>删除</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>{existingRecord ? '更新' : '保存'}</Text>
            </TouchableOpacity>
          </View>

          {/* Diet for this day */}
          {diet && (
            <View style={styles.dietSection}>
              <Text style={styles.dietTitle}>🥗 当日饮食</Text>
              <Text style={styles.dietLabel}>✅ {diet.recommend.join('、')}</Text>
              <Text style={styles.dietLabel}>❌ {diet.avoid.join('、')}</Text>
            </View>
          )}

          {/* Weather advice */}
          {weather && (
            <Text style={styles.advice}>💡 {getLifeAdvice(phaseInfo.phase, weather)}</Text>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  handle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  dateTitle: { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center' },
  phase: { fontSize: 14, color: '#FF69B4', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { width: 50, fontSize: 14, color: '#666' },
  input: { flex: 1, borderWidth: 1, borderColor: '#FFD1DC', borderRadius: 10, padding: 10, fontSize: 14, color: '#333' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  saveBtn: { backgroundColor: '#FF69B4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28 },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  deleteBtn: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#E57373' },
  deleteText: { color: '#E57373', fontWeight: '600', fontSize: 15 },
  dietSection: { marginTop: 16, backgroundColor: '#FFF5F7', borderRadius: 12, padding: 14 },
  dietTitle: { fontSize: 15, fontWeight: '700', color: '#FF69B4', marginBottom: 8 },
  dietLabel: { fontSize: 13, color: '#555', marginTop: 4, lineHeight: 20 },
  advice: { fontSize: 13, color: '#888', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  closeBtn: { marginTop: 16, alignItems: 'center' },
  closeText: { fontSize: 15, color: '#999' },
});
