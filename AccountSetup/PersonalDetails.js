import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProgressBar from '../src/Assets/Components/ProgressBar';
export default function PersonalInformation({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: "",
    birthdate: "",
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
    formData.fullName !== "" && formData.birthdate !== "";

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
              onPress={() => handleDecrement("heightFt")}
              style={styles.fieldButton}
            >
              <Text style={styles.fieldButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              onPress={() => handleIncrement("heightFt")}
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
              onPress={() => handleDecrement("heightIn")}
              style={styles.fieldButton}
            >
              <Text style={styles.fieldButtonText}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            <TouchableOpacity
              onPress={() => handleIncrement("heightIn")}
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
            onPress={() => handleDecrement("numChildren")}
            style={styles.fieldButton}
          >
            <Text style={styles.fieldButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            onPress={() => handleIncrement("numChildren")}
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
          { backgroundColor: isFormComplete ? "#E4423F" : "#ccc" },
        ]}
        onPress={isFormComplete ? () => navigation.navigate("AssignedSex") : null}
        disabled={!isFormComplete}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
 
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'stretch',
},
backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    marginTop: 30,
},
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#F9F9F9",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  fieldWrapper: {
    flex: 1,
    marginRight: 10,
  },
  fieldWrapperFull: {
    width: "100%",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  fieldButton: {
    paddingHorizontal: 10,
  },
  fieldButtonText: {
    fontSize: 20,
    color: "#888",
  },
  separator: {
    width: 1,
    height: "60%",
    backgroundColor: "#ccc",
  },
  continueButton: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

