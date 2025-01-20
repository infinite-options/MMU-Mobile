import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';

function DateAdd({ onAddTime, onRemoveTime, times }) {
  const [day, setDay] = useState('');
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [startTimeString, setStartTimeString] = useState('');
  const [endTimeString, setEndTimeString] = useState('');

  const handleAddTime = () => {
    if (day && startTimeString && endTimeString) {
      onAddTime(day, startTimeString, endTimeString);
      setDay('');
      setStart(new Date());
      setEnd(new Date());
    }
  };

  const handleStartTimeChange = (selectedDate) => {
    setStart(selectedDate);
    const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setStartTimeString(formattedTime);
  };

  const handleEndTimeChange = (selectedDate) => {
    setEnd(selectedDate);
    const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setEndTimeString(formattedTime);
  };

  return (
    <View>
      <View style={styles.pickerContainer}>
        {/* Day Picker */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>Select Day</Text>
          <Picker
            selectedValue={day}
            onValueChange={(itemValue) => setDay(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Sunday" value="Sunday" />
            <Picker.Item label="Monday" value="Monday" />
            <Picker.Item label="Tuesday" value="Tuesday" />
            <Picker.Item label="Wednesday" value="Wednesday" />
            <Picker.Item label="Thursday" value="Thursday" />
            <Picker.Item label="Friday" value="Friday" />
            <Picker.Item label="Saturday" value="Saturday" />
          </Picker>
        </View>

        {/* Start Time Picker */}
        <View style={styles.timePickerWrapper}>
          <Text style={styles.label}>Start Time</Text>
          <DatePicker
            date={start}
            mode="time"
            onDateChange={handleStartTimeChange}
            style={styles.timePicker}
          />
        </View>

        {/* End Time Picker */}
        <View style={styles.timePickerWrapper}>
          <Text style={styles.label}>End Time</Text>
          <DatePicker
            date={end}
            mode="time"
            onDateChange={handleEndTimeChange}
            style={styles.timePicker}
          />
        </View>

        {/* Add Time Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddTime}>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default DateAdd;

const styles = StyleSheet.create({
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  picker: {
    height: 50,
    backgroundColor: '#CECECE',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Lexend',
    color: 'black',
    marginBottom: 5,
  },
  timePicker: {
    backgroundColor: '#CECECE',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },

});
