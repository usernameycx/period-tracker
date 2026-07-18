import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider } from '../src/context/WeatherContext';
import { SettingsProvider } from '../src/context/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <PeriodProvider>
        <WeatherProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </WeatherProvider>
      </PeriodProvider>
    </SettingsProvider>
  );
}
