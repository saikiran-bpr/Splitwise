// src/screens/EditExpenseScreen.js
import React, { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function EditExpenseScreen({ route, navigation }) {
  const { groupId, expenseId } = route.params;
  const { groups, updateExpense, getUserName } = useContext(DataContext);
  const { user } = useContext(AuthContext);

  const group = groups.find(g => g.id === groupId);
  const expense = group?.expenses?.find(e => e.id === expenseId);
  
  const [selectedMembers, setSelectedMembers] = useState(expense?.splitBetween || []);
  const [loading, setLoading] = useState(false);

  // Ensure we have the latest expense data
  useEffect(() => {
    if (expense?.splitBetween) {
      setSelectedMembers(expense.splitBetween);
    }
  }, [expense]);

  // Only allow editing if user paid for the expense
  const canEdit = expense?.paidBy === user?.uid;

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

  const handleUpdateExpense = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert("Validation", "Please select at least one member.");
      return;
    }

    const originalMembers = expense?.splitBetween || [];
    
    // Check if there are any changes
    const hasChanges = JSON.stringify([...selectedMembers].sort()) !== JSON.stringify([...originalMembers].sort());
    
    if (!hasChanges) {
      Alert.alert("Info", "No changes detected.");
      return;
    }

    // Calculate changes
    const newMembers = selectedMembers.filter(memberId => !originalMembers.includes(memberId));
    const removedMembers = originalMembers.filter(memberId => !selectedMembers.includes(memberId));

    setLoading(true);
    try {
      if (!expenseId || !groupId) {
        throw new Error("Expense or group ID is missing");
      }
      
      await updateExpense(groupId, expenseId, {
        splitBetween: selectedMembers,
      });
      
      // Create success message
      let message = "Expense updated successfully!";
      if (newMembers.length > 0 && removedMembers.length > 0) {
        message = `${newMembers.length} member${newMembers.length !== 1 ? 's' : ''} added and ${removedMembers.length} member${removedMembers.length !== 1 ? 's' : ''} removed.`;
      } else if (newMembers.length > 0) {
        message = `${newMembers.length} member${newMembers.length !== 1 ? 's' : ''} added successfully!`;
      } else if (removedMembers.length > 0) {
        message = `${removedMembers.length} member${removedMembers.length !== 1 ? 's' : ''} removed successfully!`;
      }
      
      Alert.alert("Success", message, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Error updating expense:", err);
      Alert.alert("Error", err.message || "Failed to update expense. Please try again.");
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
    const wasInOriginal = expense?.splitBetween?.includes(memberId);
    const isNewMember = isSelected && !wasInOriginal;
    const isRemovedMember = !isSelected && wasInOriginal;

    return (
      <TouchableOpacity
        style={[
          styles.memberItem, 
          isSelected && styles.memberItemSelected, 
          isNewMember && styles.memberItemNew,
          isRemovedMember && styles.memberItemRemoved
        ]}
        onPress={() => toggleMember(memberId)}
      >
        <View style={styles.memberContent}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {name} {isCurrentUser && "(You)"}
            </Text>
            {isNewMember && (
              <Text style={styles.newMemberLabel}>New</Text>
            )}
            {isRemovedMember && (
              <Text style={styles.removedMemberLabel}>Removed</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!group || !expense) {
    return (
      <View style={styles.container}>
        <Text>Expense not found</Text>
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon source="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Cannot Edit Expense</Text>
          <Text style={styles.errorText}>
            You can only edit expenses that you paid for.
          </Text>
        </View>
      </View>
    );
  }

  const splitAmount = expense.amount / selectedMembers.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.expenseInfoCard}>
          <View style={styles.expenseInfoRow}>
            <Icon source="receipt" size={20} color="#6366F1" />
            <Text style={styles.expenseDescription}>{expense.description}</Text>
          </View>
          <View style={styles.expenseInfoRow}>
            <Text style={styles.expenseLabel}>Amount:</Text>
            <Text style={styles.expenseAmount}>₹{expense.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.expenseInfoRow}>
            <Text style={styles.expenseLabel}>Current split:</Text>
            <Text style={styles.expenseSplit}>₹{splitAmount.toFixed(2)} per person</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Icon source="account-multiple" size={18} color="#6366F1" />
              <Text style={styles.label}>Edit Members in Split</Text>
            </View>
            <Text style={styles.hint}>
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              {(() => {
                const originalCount = expense.splitBetween?.length || 0;
                const newCount = selectedMembers.filter(m => !expense.splitBetween?.includes(m)).length;
                const removedCount = (expense.splitBetween || []).filter(m => !selectedMembers.includes(m)).length;
                const parts = [];
                if (newCount > 0) parts.push(`${newCount} new`);
                if (removedCount > 0) parts.push(`${removedCount} removed`);
                return parts.length > 0 ? ` (${parts.join(', ')})` : '';
              })()}
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
            onPress={handleUpdateExpense}
            disabled={loading}
          >
            <Icon source="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Update Expense"}
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
  expenseInfoCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  expenseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  expenseDescription: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  expenseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
  expenseSplit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  form: {
    flex: 1,
    padding: 24,
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
  memberItemNew: {
    borderColor: "#10B981",
    backgroundColor: "#D1FAE5",
  },
  memberItemRemoved: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2",
    opacity: 0.7,
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
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  newMemberLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removedMemberLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
  },
});

