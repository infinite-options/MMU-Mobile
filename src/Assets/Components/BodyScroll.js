import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DrawerContext from './DrawerContext';

function BodyScroll({ options, title }) {
  const [pickerValue, setPickerValue] = useState(null);
  const [modalVisible, setModalVisible] = useState(true); // Make the modal visible immediately

  const { setPassData, setComplete, passData, complete, setOption, option, handleSetSpecifics } = useContext(DrawerContext);

  const handlePickerChange = (itemValue) => {
    setPickerValue(itemValue);
    if (option) {
      handleSetSpecifics(option, itemValue);
      setComplete(false);
      setOption('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal to display the Picker */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            {/* Dynamic Title */}
            <Text style={styles.pickerTitle}>{title}</Text>

            {/* Picker for selecting options */}
            <Picker
              selectedValue={pickerValue}
              onValueChange={(itemValue) => handlePickerChange(itemValue)}
              style={styles.picker}
            >
              {options.map((option) => (
                <Picker.Item key={option} label={String(option)} value={option} />
              ))}
            </Picker>

            {/* Complete Button */}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.completeButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default BodyScroll;

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '150%',
  },
  pickerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  picker: {
    height: 150,
    width: '100%',
  },
  completeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
