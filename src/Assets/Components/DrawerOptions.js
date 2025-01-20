import React, { useState, useContext, useEffect } from 'react';
import { View, Modal, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import DrawerContext from './DrawerContext';
import BodyScroll from './BodyScroll';

const DrawerOptions = () => {
  const [open, setOpen] = useState(false);
  const { option, setOption } = useContext(DrawerContext);
  const { specifics, handleSetSpecifics } = useContext(DrawerContext);
  const [textValue, setTextValue] = useState('');

  useEffect(() => {
    if (option) {
      setOpen(true);
      // If it's a text field option, set the current value for the text input
      if (['religion', 'position', 'nationality'].includes(option)) {
        setTextValue(specifics[option] || '');
      }
    } else {
      setOpen(false);
    }
  }, [option]);

  const optionsData = {
    height: {
      title: "What's Your Height?",
      options: ['166', '167', '168', '169', '170']
    },
    education: {
      title: "Your Education",
      options: ['Did not finish High School', 'Finished High School', 'Did not finish College', 'Completed Associates Degree', 'Completed Bachelors Degree', 'Completed Graduate Degree']
    },
    body: {
      title: "Body Composition",
      options: ['Slim', 'Athlete', 'Curvy', 'Plus Size', 'Few Extra Pounds']
    },
    star: {
      title: "What's your Star Sign?",
      options: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
    },
    drinking: {
      title: "Your Drinking Habits",
      options: ["I don't drink", 'Socially', 'Casual Drinker', 'Regularly']
    },
    smoking: {
      title: "Your Smoking Habits",
      options: ["I don't smoke", 'Socially', 'Casual Smoker', 'Regularly']
    },
    children: {
      title: "Do You Have Any Children",
      options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    }
  };

  const handleSaveText = () => {
    // Save the text input value to the context state
    handleSetSpecifics(option, textValue);
    setOpen(false);
    setOption('');
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setOption('')}
    >
      <View style={styles.modalContainer}>
        {option && ['religion', 'position', 'nationality'].includes(option) ? (
          <View style={styles.textInputContainer}>
            <Text style={styles.inputTitle}>
              {option === 'religion' && 'Religion'}
              {option === 'position' && 'Your Current Job'}
              {option === 'nationality' && 'Your Nationality'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={textValue}
              onChangeText={setTextValue}
              placeholder={`Enter your ${option}`}
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveText}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          option && (
            <BodyScroll
              title={optionsData[option]?.title || 'Select Option'}
              options={optionsData[option]?.options || []}
            />
          )
        )}
      </View>
    </Modal>
  );
};

export default DrawerOptions;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  textInputContainer: {
    backgroundColor: '#fff',
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    width: '100%',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#E4423F',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
