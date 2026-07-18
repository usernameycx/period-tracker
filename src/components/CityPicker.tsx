import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useWeather } from '../context/WeatherContext';
import * as Location from 'expo-location';

export default function CityPicker() {
  const { city, setCity, useGPS, setUseGPS } = useSettings();
  const { refresh } = useWeather();
  const [query, setQuery] = useState(city);
  const [showSearch, setShowSearch] = useState(false);

  const handleToggleGPS = async (v: boolean) => {
    setUseGPS(v);
    if (v) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        // Reverse geocode to get city name
        const [addr] = await Location.reverseGeocodeAsync(loc.coords);
        if (addr?.city) setCity(addr.city);
      }
    } else {
      setShowSearch(true);
    }
    refresh();
  };

  const handleSetCity = () => {
    if (query.trim()) {
      setCity(query.trim());
      setShowSearch(false);
      refresh();
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📍 天气位置</Text>
      <View style={styles.row}>
        <Text style={styles.label}>自动定位 (GPS)</Text>
        <Switch value={useGPS} onValueChange={handleToggleGPS} trackColor={{ true: '#FFB6C1' }} thumbColor="#FF69B4" />
      </View>
      {!useGPS && (
        <View style={styles.searchRow}>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="输入城市名" />
          <TouchableOpacity style={styles.btn} onPress={handleSetCity}>
            <Text style={styles.btnText}>确认</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.current}>当前：{city}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: '#FF69B4', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 15, color: '#555' },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#FFD1DC', borderRadius: 10, padding: 10, fontSize: 14 },
  btn: { backgroundColor: '#FF69B4', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  current: { marginTop: 10, fontSize: 13, color: '#999' },
});
