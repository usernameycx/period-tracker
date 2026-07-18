import React from 'react';
import { ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import WeatherCard from '../../src/components/WeatherCard';
import CycleStatusCard from '../../src/components/CycleStatusCard';
import DietCard from '../../src/components/DietCard';
import { useWeather } from '../../src/context/WeatherContext';
import { usePeriod } from '../../src/context/PeriodContext';

export default function TodayPage() {
  const { refresh: refreshWeather } = useWeather();
  const { refresh: refreshPeriod } = usePeriod();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshWeather(), refreshPeriod()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF69B4" />}
    >
      <Text style={styles.greeting}>🌸 早安，今天也要好好爱自己</Text>
      <WeatherCard />
      <CycleStatusCard />
      <DietCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 30 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FF69B4', marginBottom: 18 },
});
