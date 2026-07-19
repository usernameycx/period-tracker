import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Animated, Pressable } from 'react-native';
import { SelectedDateProvider } from '../../src/context/SelectedDateContext';
import OnboardingModal from '../../src/components/OnboardingModal';
import Icon, { IconName } from '../../src/components/Icon';
import { Colors, Radius, Spacing, FontSize } from '../../src/constants/theme';

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      speed: 14,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon name={name} size={24} color={color} />
    </Animated.View>
  );
}

/** Custom tab button that suppresses the default Android ripple for a clean feel. */
function TabButton(props: any) {
  return (
    <Pressable
      {...props}
      android_ripple={null}
      style={({ pressed }) => [
        props.style,
        pressed && { opacity: 0.7 },
      ]}
    />
  );
}

export default function TabLayout() {
  return (
    <SelectedDateProvider>
      <OnboardingModal />
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarStyle: {
          borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
          height: 62, paddingBottom: Spacing.sm, paddingTop: 6,
          backgroundColor: Colors.white,
          shadowColor: Colors.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '700' },
      }}>
        <Tabs.Screen name="index" options={{ tabBarLabel: '今日', tabBarIcon: ({ focused, color }) => <TabIcon name="today" focused={focused} color={String(color)} />, tabBarButton: (props: any) => <TabButton {...props} /> }} />
        <Tabs.Screen name="calendar" options={{ tabBarLabel: '日历', tabBarIcon: ({ focused, color }) => <TabIcon name="calendar" focused={focused} color={String(color)} />, tabBarButton: (props: any) => <TabButton {...props} /> }} />
        <Tabs.Screen name="settings" options={{ tabBarLabel: '设置', tabBarIcon: ({ focused, color }) => <TabIcon name="settings" focused={focused} color={String(color)} />, tabBarButton: (props: any) => <TabButton {...props} /> }} />
      </Tabs>
    </SelectedDateProvider>
  );
}
