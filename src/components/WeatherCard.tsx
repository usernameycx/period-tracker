import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useWeather } from '../context/WeatherContext';
import { useSettings } from '../context/SettingsContext';

export default function WeatherCard() {
  const { weather, loading, error } = useWeather();
  const { city } = useSettings();

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator color="#FF69B4" />
        <Text style={styles.loadingText}>获取天气中...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.errorText}>{error ?? '暂无天气数据'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{weather.icon}</Text>
        <View>
          <Text style={styles.temp}>{weather.temperature}°</Text>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>
        <View style={styles.cityBadge}>
          <Text style={styles.cityText}>{city}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.advice}>💡 {weather.advice}</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>☀️ UV: {weather.uvIndex} {weather.uvAdvice}</Text>
        <Text style={styles.detail}>💧 湿度: {weather.humidity}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    shadowColor: '#FFB6C1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, marginBottom: 14,
  },
  center: { alignItems: 'center', paddingVertical: 30 },
  header: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 40, marginRight: 12 },
  temp: { fontSize: 32, fontWeight: '700', color: '#FF69B4' },
  condition: { fontSize: 14, color: '#999', marginTop: 2 },
  cityBadge: { marginLeft: 'auto', backgroundColor: '#FFF0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  cityText: { fontSize: 13, color: '#FF69B4', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#FFF0F3', marginVertical: 12 },
  advice: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 8 },
  details: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { fontSize: 12, color: '#999' },
  loadingText: { marginTop: 8, color: '#999', fontSize: 13 },
  errorText: { color: '#999', fontSize: 14 },
});
