import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, label }: { emoji: string; label: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FF69B4',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: 60, paddingBottom: 8, paddingTop: 4 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ tabBarLabel: '今日', tabBarIcon: () => <TabIcon emoji="🏠" label="今日" /> }} />
      <Tabs.Screen name="calendar" options={{ tabBarLabel: '日历', tabBarIcon: () => <TabIcon emoji="📅" label="日历" /> }} />
      <Tabs.Screen name="settings" options={{ tabBarLabel: '设置', tabBarIcon: () => <TabIcon emoji="⚙️" label="设置" /> }} />
    </Tabs>
  );
}
