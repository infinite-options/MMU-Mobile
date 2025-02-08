import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { colors } from "../../../src/theme/theme";

const DrawerOptions = ({ visible, onClose, onLogout, onDeleteAccount }) => {
  return (
    <Modal animationType='fade' transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.deleteButton} onPress={onDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    borderColor: colors.gray[400],
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 15,
    width: "100%",
  },
  cancelText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
    width: "100%",
  },
  deleteText: {
    color: colors.text.light,
    fontSize: 16,
    textAlign: "center",
  },
  logoutButton: {
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
    width: "100%",
  },
  logoutText: {
    color: colors.primary,
    fontSize: 16,
    textAlign: "center",
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: colors.background.overlay,
    flex: 1,
    justifyContent: "center",
  },
});

export default DrawerOptions;
