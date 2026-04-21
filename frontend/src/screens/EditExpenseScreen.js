// src/screens/EditExpenseScreen.js
import React, { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

const CATEGORIES = [
  { key: "food", label: "Food", icon: "🍔" },
  { key: "transport", label: "Transport", icon: "🚗" },
  { key: "entertainment", label: "Fun", icon: "🎬" },
  { key: "shopping", label: "Shopping", icon: "🛒" },
  { key: "utilities", label: "Utilities", icon: "💡" },
  { key: "rent", label: "Rent", icon: "🏠" },
  { key: "travel", label: "Travel", icon: "✈️" },
  { key: "health", label: "Health", icon: "🏥" },
  { key: "education", label: "Education", icon: "📚" },
  { key: "other", label: "Other", icon: "📋" },
];

const SPLIT_TYPES = [
  { key: "equal", label: "Equal" },
  { key: "exact", label: "Exact" },
  { key: "percentage", label: "Percentage" },
  { key: "shares", label: "Shares" },
];

export default function EditExpenseScreen({ route, navigation }) {
  const { groupId, expenseId } = route.params;
  const { getExpenseDetail, getGroupDetail, updateExpense } = useContext(DataContext);
  const { user } = useContext(AuthContext);

  const [expense, setExpense] = useState(null);
  const [members, setMembers] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [splitType, setSplitType] = useState("equal");
  const [notes, setNotes] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [splitData, setSplitData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(true);

  useEffect(() => {
    loadExpenseData();
  }, []);

  const loadExpenseData = async () => {
    try {
      const [expenseData, groupData] = await Promise.all([
        getExpenseDetail(expenseId),
        getGroupDetail(groupId),
      ]);

      setExpense(expenseData);
      setMembers(groupData.group?.members || []);

      // Populate form from expense
      setDescription(expenseData.description || "");
      setAmount(expenseData.amount?.toString() || "");
      setCategory(expenseData.category || "other");
      setSplitType(expenseData.splitType || "equal");
      setNotes(expenseData.notes || "");

      // Set selected members from splits
      if (expenseData.splits && expenseData.splits.length > 0) {
        const splitMemberIds = expenseData.splits.map(s => s.user?._id || s.user);
        setSelectedMemberIds(splitMemberIds);

        // Populate split data for non-equal splits
        if (expenseData.splitType && expenseData.splitType !== "equal") {
          const data = {};
          expenseData.splits.forEach(s => {
            const id = s.user?._id || s.user;
            if (expenseData.splitType === "exact") {
              data[id] = s.amount?.toString() || "";
            } else if (expenseData.splitType === "percentage") {
              data[id] = s.percentage?.toString() || "";
            } else if (expenseData.splitType === "shares") {
              data[id] = s.shares?.toString() || "";
            }
          });
          setSplitData(data);
        }
      } else {
        // Fallback: select all group members
        const allIds = (groupData.group?.members || []).map(m => m.user?._id || m.user);
        setSelectedMemberIds(allIds);
      }
    } catch (error) {
      console.error("Error loading expense:", error);
      Alert.alert("Error", "Failed to load expense details.");
    } finally {
      setLoadingExpense(false);
    }
  };

  const canEdit = () => {
    if (!expense || !user?._id) return false;
    return expense.paidBy?._id === user._id || expense.createdBy === user._id;
  };

  const toggleMember = (memberId) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length === 1) {
        Alert.alert("Validation", "At least one member must be selected.");
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const updateSplitValue = (memberId, value) => {
    setSplitData(prev => ({ ...prev, [memberId]: value }));
  };

  const getAvatarColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = (name || "U").charCodeAt(0) % colors.length;
    return colors[index];
  };

  const validateSplitData = () => {
    const amountNum = parseFloat(amount);
    if (splitType === "exact") {
      const total = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(splitData[id]) || 0), 0);
      if (Math.abs(total - amountNum) > 0.01) {
        Alert.alert("Validation", `Exact amounts must sum to $${amountNum.toFixed(2)}. Currently: $${total.toFixed(2)}`);
        return false;
      }
    }
    if (splitType === "percentage") {
      const total = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(splitData[id]) || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        Alert.alert("Validation", `Percentages must sum to 100%. Currently: ${total.toFixed(1)}%`);
        return false;
      }
    }
    if (splitType === "shares") {
      const totalShares = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(splitData[id]) || 0), 0);
      if (totalShares <= 0) {
        Alert.alert("Validation", "Total shares must be greater than 0.");
        return false;
      }
    }
    return true;
  };

  const handleUpdateExpense = async () => {
    if (!description.trim()) {
      Alert.alert("Validation", "Please enter a description.");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }

    if (selectedMemberIds.length === 0) {
      Alert.alert("Validation", "Please select at least one member.");
      return;
    }

    if (splitType !== "equal" && !validateSplitData()) {
      return;
    }

    setLoading(true);
    try {
      const updates = {
        description: description.trim(),
        amount: amountNum,
        category,
        splitType,
        notes: notes.trim(),
      };

      if (splitType === "equal") {
        updates.members = selectedMemberIds;
      } else if (splitType === "exact") {
        updates.splitData = selectedMemberIds.map(id => ({
          userId: id,
          amount: parseFloat(splitData[id]) || 0,
        }));
      } else if (splitType === "percentage") {
        updates.splitData = selectedMemberIds.map(id => ({
          userId: id,
          percentage: parseFloat(splitData[id]) || 0,
        }));
      } else if (splitType === "shares") {
        updates.splitData = selectedMemberIds.map(id => ({
          userId: id,
          shares: parseFloat(splitData[id]) || 0,
        }));
      }

      await updateExpense(expenseId, updates);
      Alert.alert("Success", "Expense updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Error updating expense:", err);
      Alert.alert("Error", err.message || "Failed to update expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }) => {
    const memberUser = item.user || item;
    const memberId = memberUser._id;
    const memberName = memberUser.name || memberUser.email || "Unknown";
    const isSelected = selectedMemberIds.includes(memberId);
    const isCurrentUser = memberId === user?._id;
    const avatarColor = getAvatarColor(memberName);

    return (
      <View style={[styles.memberItem, isSelected && styles.memberItemSelected]}>
        <TouchableOpacity
          style={styles.memberContent}
          onPress={() => toggleMember(memberId)}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{memberName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.memberName} numberOfLines={1}>
            {memberName} {isCurrentUser && "(You)"}
          </Text>
        </TouchableOpacity>
        {isSelected && splitType !== "equal" && (
          <View style={styles.splitInputContainer}>
            <Text style={styles.splitInputPrefix}>
              {splitType === "exact" ? "$" : splitType === "percentage" ? "%" : "#"}
            </Text>
            <TextInput
              style={styles.splitInput}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={splitData[memberId] || ""}
              onChangeText={(val) => updateSplitValue(memberId, val)}
            />
          </View>
        )}
      </View>
    );
  };

  if (loadingExpense) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading expense...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  if (!canEdit()) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon source="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Cannot Edit Expense</Text>
          <Text style={styles.errorTextMsg}>
            You can only edit expenses that you paid for or created.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Expense Info Header */}
        <View style={styles.expenseInfoCard}>
          <View style={styles.expenseInfoRow}>
            <Icon source="receipt" size={20} color="#6366F1" />
            <Text style={styles.expenseTitle}>Edit Expense</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Description */}
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

          {/* Amount */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="currency-usd" size={18} color="#6366F1" />
              <Text style={styles.label}>Amount</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.currency}>$</Text>
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

          {/* Category */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="tag" size={18} color="#6366F1" />
              <Text style={styles.label}>Category</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, category === cat.key && styles.categoryChipSelected]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryChipText, category === cat.key && styles.categoryChipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Split Type */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="call-split" size={18} color="#6366F1" />
              <Text style={styles.label}>Split Type</Text>
            </View>
            <View style={styles.splitTypeRow}>
              {SPLIT_TYPES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  style={[styles.splitTypeChip, splitType === st.key && styles.splitTypeChipSelected]}
                  onPress={() => setSplitType(st.key)}
                >
                  <Text style={[styles.splitTypeTextLabel, splitType === st.key && styles.splitTypeTextSelected]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Members */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Icon source="account-multiple" size={18} color="#6366F1" />
              <Text style={styles.label}>Split Between</Text>
            </View>
            <Text style={styles.hint}>
              {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected
            </Text>
          </View>

          <FlatList
            data={members}
            keyExtractor={(item) => item.user?._id || item._id || String(item)}
            renderItem={renderMember}
            scrollEnabled={false}
            style={styles.membersList}
            contentContainerStyle={styles.membersListContent}
          />

          {/* Notes */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="note-text" size={18} color="#6366F1" />
              <Text style={styles.label}>Notes (optional)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add any notes..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

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
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6C757D",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
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
  errorTextMsg: {
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
  },

  // Info card
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
  },
  expenseTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
  notesInput: {
    minHeight: 56,
    textAlignVertical: "top",
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

  // Category chips
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  categoryChipSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  categoryChipIcon: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
  },
  categoryChipTextSelected: {
    color: "#6366F1",
  },

  // Split type
  splitTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  splitTypeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  splitTypeChipSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  splitTypeTextLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
  },
  splitTypeTextSelected: {
    color: "#6366F1",
  },

  // Members
  membersList: {
    marginBottom: 16,
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
    flex: 1,
  },
  splitInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 72,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  splitInputPrefix: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366F1",
    paddingLeft: 12,
  },
  splitInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
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
