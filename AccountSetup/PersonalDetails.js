import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../src/Assets/Components/ProgressBar';
export default function PersonalInformation({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    birthdate: '',
    heightFt: 0,
    heightIn: 0,
    numChildren: 0,
  });

  const handleIncrement = (name) => {
    setFormData({ ...formData, [name]: formData[name] + 1 });
  };

  const handleDecrement = (name) => {
    setFormData({
      ...formData,
      [name]: formData[name] > 0 ? formData[name] - 1 : 0,
    });
  };

  const isFormComplete =
    formData.fullName !== '' && formData.birthdate !== '';

  return (
    <View style={styles.container}>
      {/* Back Button */}
                  <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => navigation.goBack()}
                  >
                      <Ionicons name="arrow-back" size={28} color="red" />
                  </TouchableOpacity>

      {/* Progress Bar */}
        <ProgressBar progress={20} />

      {/* Title and Subtitle */}
      <Text style={styles.title}>Some personal information</Text>
      <Text style={styles.subtitle}>
        Your full name, age, height, and # of children will be public.
      </Text>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.fullName}
        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Birthdate (dd/mm/yyyy)"
        value={formData.birthdate}
        keyboardType="numeric"
        onChangeText={(text) => setFormData({ ...formData, birthdate: text })}
      />

      {/* Height Section */}
      <View style={styles.row}>
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Height (ft)</Text>
          <View style={styles.field}>
          <Text style={styles.fieldValue}>{formData.heightFt}</Text>
            <TouchableOpacity
              onPress={() => handleDecrement('heightFt')}
              style={styles.fieldButton}
            >
              <Text style={styles.fieldButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              onPress={() => handleIncrement('heightFt')}
              style={styles.fieldButton}
            >
              <Text style={styles.fieldButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Height (in)</Text>
          <View style={styles.field}>
          <Text style={styles.fieldValue}>{formData.heightIn}</Text>
            <TouchableOpacity
              onPress={() => handleDecrement('heightIn')}
              style={styles.fieldButton}
            >
              <Text style={styles.fieldButtonText}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            <TouchableOpacity
              onPress={() => handleIncrement('heightIn')}
              style={styles.fieldButton}
            >
              <Text style={styles.fieldButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Number of Children Section */}
      <View style={styles.fieldWrapperFull}>
        <Text style={styles.fieldLabel}># of Children</Text>
        <View style={styles.field}>
        <Text style={styles.fieldValue}>{formData.numChildren}</Text>
          <TouchableOpacity
            onPress={() => handleDecrement('numChildren')}
            style={styles.fieldButton}
          >
            <Text style={styles.fieldButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            onPress={() => handleIncrement('numChildren')}
            style={styles.fieldButton}
          >
            <Text style={styles.fieldButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.continueButton,
          { backgroundColor: isFormComplete ? '#E4423F' : '#ccc' },
        ]}
        onPress={isFormComplete ? () => navigation.navigate('AssignedSex') : null}
        disabled={!isFormComplete}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
 
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 30,
    padding: 8,
},
container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'stretch',
},
  continueButton: {
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 20,
    paddingVertical: 15,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  field: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
  },
  fieldButton: {
    paddingHorizontal: 10,
  },
  fieldButtonText: {
    color: '#888',
    fontSize: 20,
  },
  fieldLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldWrapper: {
    flex: 1,
    marginRight: 10,
  },
  fieldWrapperFull: {
    marginBottom: 20,
    width: '100%',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  separator: {
    backgroundColor: '#ccc',
    height: '60%',
    width: 1,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

