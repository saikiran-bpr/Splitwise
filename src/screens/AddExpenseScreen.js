// src/screens/AddExpenseScreen.js
import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { groups, addExpense, getUserName } = useContext(DataContext);
  const { user } = useContext(AuthContext);

  const group = groups.find(g => g.id === groupId);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(group?.members || []);
  const [loading, setLoading] = useState(false);

  const toggleMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length === 1) {
        Alert.alert("Validation", "At least one member must be selected.");
        return;
      }
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleAddExpense = async () => {
    if (!description.trim()) {
      Alert.alert("Validation", "Please enter a description.");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert("Validation", "Please select at least one member.");
      return;
    }

    setLoading(true);
    try {
      if (!user?.uid) {
        throw new Error("User not authenticated");
      }
      if (!groupId) {
        throw new Error("Group ID is missing");
      }
      await addExpense(groupId, {
        description: description.trim(),
        amount: amountNum,
        paidBy: user.uid,
        splitBetween: selectedMembers,
      });
      Alert.alert("Success", "Expense added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Error adding expense:", err);
      Alert.alert("Error", err.message || "Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (userId) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const name = getUserName(userId);
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderMember = ({ item: memberId }) => {
    const isSelected = selectedMembers.includes(memberId);
    const name = getUserName(memberId);
    const isCurrentUser = memberId === user?.uid;
    const avatarColor = getAvatarColor(memberId);

    return (
      <TouchableOpacity
        style={[styles.memberItem, isSelected && styles.memberItemSelected]}
        onPress={() => toggleMember(memberId)}
      >
        <View style={styles.memberContent}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.memberName}>
            {name} {isCurrentUser && "(You)"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="text" size={18} color="#6366F1" />
              <Text style={styles.label}>Description</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dinner, Groceries, Hotel"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="currency-usd" size={18} color="#6366F1" />
              <Text style={styles.label}>Amount</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Icon source="account-multiple" size={18} color="#6366F1" />
              <Text style={styles.label}>Split Between</Text>
            </View>
            <Text style={styles.hint}>
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </Text>
          </View>

          <FlatList
            data={group.members}
            keyExtractor={(item) => item}
            renderItem={renderMember}
            style={styles.membersList}
            contentContainerStyle={styles.membersListContent}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddExpense}
            disabled={loading}
          >
            <Icon source="plus-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? "Adding..." : "Add Expense"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  hint: {
    fontSize: 13,
    color: "#6C757D",
    marginTop: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  currency: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366F1",
    paddingLeft: 16,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  membersList: {
    flex: 1,
    marginBottom: 20,
  },
  membersListContent: {
    paddingBottom: 8,
  },
  memberItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  memberItemSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  memberContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  button: {
    backgroundColor: "#6366F1",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
