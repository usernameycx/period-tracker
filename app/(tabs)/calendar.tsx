import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CalendarView from '../../src/components/CalendarView';
import DayDetailSheet from '../../src/components/DayDetailSheet';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={styles.container}>
      <CalendarView
        selectedDate={selectedDate}
        currentMonth={currentMonth}
        onDayPress={(d) => { setSelectedDate(d); setSheetVisible(true); }}
        onMonthChange={setCurrentMonth}
      />
      <DayDetailSheet
        visible={sheetVisible}
        date={selectedDate}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7', paddingTop: 60, paddingHorizontal: 16 },
});
