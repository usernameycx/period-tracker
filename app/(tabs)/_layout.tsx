import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Animated, Pressable } from 'react-native';
import { SelectedDateProvider } from '../../src/context/SelectedDateContext';
import OnboardingModal from '../../src/components/OnboardingModal';
import Icon, { IconName } from '../../src/components/Icon';
import { Colors, Radius, Spacing, FontSize, Weight } from '../../src/constants/theme';

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      speed: 14,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon name={name} size={24} color={color} />
    </Animated.View>
  );
}

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
          borderTopLeftRadius: Radius.xxl,
          borderTopRightRadius: Radius.xxl,
          height: 64,
          paddingBottom: Spacing.sm,
          paddingTop: 6,
          backgroundColor: Colors.white,
          shadowColor: 'transparent',
          elevation: 0,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: Weight.bold,
        },
      }}>
        <Tabs.Screen name="index" options={{ tabBarLabel: '今日', tabBarIcon: ({ focused, color }) => <TabIcon name="today" focused={focused} color={String(color)} />, tabBarButton: (props: any) => <TabButton {...props} /> }} />
        <Tabs.Screen name="calendar" options={{ tabBarLabel: '日历', tabBarIcon: ({ focused, color }) => <TabIcon name="calendar" focused={focused} color={String(color)} />, tabBarButton: (props: any) => <TabButton {...props} /> }} />
        <Tabs.Screen name="settings" options={{ tabBarLabel: '设置', tabBarIcon: ({ focused, color }) => <TabIcon name="settings" focused={focused} color={String(color)} />, tabBarButton: (props: any) => <TabButton {...props} /> }} />
      </Tabs>
    </SelectedDateProvider>
  );
}
