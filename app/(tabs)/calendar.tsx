import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import CalendarView from '../../src/components/CalendarView';
import DayDetailSheet from '../../src/components/DayDetailSheet';
import LunarCard from '../../src/components/LunarCard';
import { useSelectedDate } from '../../src/context/SelectedDateContext';
import { Colors, Spacing } from '../../src/constants/theme';

export default function CalendarPage() {
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <CalendarView
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDayPress={(d) => { setSelectedDate(d); setSheetVisible(true); }}
          onMonthChange={setCurrentMonth}
        />
        <LunarCard date={selectedDate} />
      </ScrollView>
      <DayDetailSheet
        visible={sheetVisible}
        date={selectedDate}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: Spacing.pageTop, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.pageBottom },
});
