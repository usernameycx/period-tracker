import { View, Text, StyleSheet } from 'react-native';

export default function TodayPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌸 今日</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7', paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FF69B4' },
});
