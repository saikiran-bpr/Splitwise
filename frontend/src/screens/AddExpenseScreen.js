// src/screens/AddExpenseScreen.js
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

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members: passedMembers } = route.params;
  const { addExpense, getGroupDetail } = useContext(DataContext);
  const { user } = useContext(AuthContext);

  const [members, setMembers] = useState(passedMembers || []);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [splitType, setSplitType] = useState("equal");
  const [notes, setNotes] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [splitData, setSplitData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(!passedMembers);

  useEffect(() => {
    if (!passedMembers || passedMembers.length === 0) {
      loadGroupMembers();
    } else {
      initializeMembers(passedMembers);
    }
  }, []);

  const loadGroupMembers = async () => {
    try {
      const data = await getGroupDetail(groupId);
      const groupMembers = data.group?.members || [];
      setMembers(groupMembers);
      initializeMembers(groupMembers);
    } catch (error) {
      Alert.alert("Error", "Failed to load group members.");
    } finally {
      setLoadingGroup(false);
    }
  };

  const initializeMembers = (memberList) => {
    const allIds = memberList.map(m => m.user?._id || m.user);
    setSelectedMemberIds(allIds);
    const initialSplitData = {};
    allIds.forEach(id => {
      initialSplitData[id] = "";
    });
    setSplitData(initialSplitData);
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

    if (selectedMemberIds.length === 0) {
      Alert.alert("Validation", "Please select at least one member.");
      return;
    }

    if (splitType !== "equal" && !validateSplitData()) {
      return;
    }

    setLoading(true);
    try {
      if (!user?._id) {
        throw new Error("User not authenticated");
      }

      const expensePayload = {
        groupId,
        description: description.trim(),
        amount: amountNum,
        category,
        paidBy: user._id,
        splitType,
        notes: notes.trim(),
      };

      if (splitType === "equal") {
        expensePayload.members = selectedMemberIds;
      } else if (splitType === "exact") {
        expensePayload.splitData = selectedMemberIds.map(id => ({
          userId: id,
          amount: parseFloat(splitData[id]) || 0,
        }));
      } else if (splitType === "percentage") {
        expensePayload.splitData = selectedMemberIds.map(id => ({
          userId: id,
          percentage: parseFloat(splitData[id]) || 0,
        }));
      } else if (splitType === "shares") {
        expensePayload.splitData = selectedMemberIds.map(id => ({
          userId: id,
          shares: parseFloat(splitData[id]) || 0,
        }));
      }

      await addExpense(expensePayload);
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

  const renderSplitSummary = () => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum === 0 || selectedMemberIds.length === 0) return null;

    if (splitType === "equal") {
      const perPerson = amountNum / selectedMemberIds.length;
      return (
        <View style={styles.splitSummary}>
          <Text style={styles.splitSummaryText}>
            ${perPerson.toFixed(2)} per person ({selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''})
          </Text>
        </View>
      );
    }

    if (splitType === "exact") {
      const total = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(splitData[id]) || 0), 0);
      const remaining = amountNum - total;
      return (
        <View style={styles.splitSummary}>
          <Text style={[styles.splitSummaryText, Math.abs(remaining) > 0.01 && { color: "#EF4444" }]}>
            ${total.toFixed(2)} of ${amountNum.toFixed(2)} allocated
            {Math.abs(remaining) > 0.01 ? ` (${remaining > 0 ? "$" + remaining.toFixed(2) + " remaining" : "over by $" + Math.abs(remaining).toFixed(2)})` : " - balanced"}
          </Text>
        </View>
      );
    }

    if (splitType === "percentage") {
      const total = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(splitData[id]) || 0), 0);
      return (
        <View style={styles.splitSummary}>
          <Text style={[styles.splitSummaryText, Math.abs(total - 100) > 0.01 && { color: "#EF4444" }]}>
            {total.toFixed(1)}% of 100% allocated
          </Text>
        </View>
      );
    }

    if (splitType === "shares") {
      const totalShares = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(splitData[id]) || 0), 0);
      const perShare = totalShares > 0 ? amountNum / totalShares : 0;
      return (
        <View style={styles.splitSummary}>
          <Text style={styles.splitSummaryText}>
            {totalShares} total shares (${perShare.toFixed(2)} per share)
          </Text>
        </View>
      );
    }
    return null;
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

  if (loadingGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading group...</Text>
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
                  <Text style={[styles.splitTypeText, splitType === st.key && styles.splitTypeTextSelected]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Split Summary */}
          {renderSplitSummary()}

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
  form: {
    flex: 1,
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
  splitTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
  },
  splitTypeTextSelected: {
    color: "#6366F1",
  },

  // Split summary
  splitSummary: {
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  splitSummaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803D",
    textAlign: "center",
  },

  // Members
  membersList: {
    flex: 1,
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
