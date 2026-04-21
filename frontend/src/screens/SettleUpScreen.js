// src/screens/SettleUpScreen.js
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Icon } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";
import { DataContext } from "../context/DataContext";

export default function SettleUpScreen({ route, navigation }) {
  const { groupId, payeeId: initialPayeeId, payeeName: initialPayeeName, suggestedAmount } = route.params || {};
  const { user } = useContext(AuthContext);
  const { settleUp, getGroupDetail, friends } = useContext(DataContext);

  const [amount, setAmount] = useState(suggestedAmount ? String(suggestedAmount) : "");
  const [note, setNote] = useState("");
  const [selectedPayeeId, setSelectedPayeeId] = useState(initialPayeeId || null);
  const [selectedPayeeName, setSelectedPayeeName] = useState(initialPayeeName || "");
  const [people, setPeople] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (groupId) {
        const data = await getGroupDetail(groupId);
        const group = data?.group || data;
        setGroupName(group?.name || "");
        const members = (group?.members || []).filter(
          (m) => (m._id || m) !== user?._id
        );
        setPeople(
          members.map((m) => ({
            _id: m._id || m,
            name: m.name || m.email || "Unknown",
          }))
        );
      } else {
        setPeople(
          (friends || []).map((f) => ({
            _id: f._id,
            name: f.name || f.email || "Unknown",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading settle up data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = (name || "U").charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }
    if (!selectedPayeeId) {
      Alert.alert("Error", "Please select a person to pay.");
      return;
    }
    setSubmitting(true);
    try {
      await settleUp({
        groupId: groupId || undefined,
        payeeId: selectedPayeeId,
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
      Alert.alert("Success", `Payment of \u20B9${parsedAmount.toFixed(2)} to ${selectedPayeeName} recorded.`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectPerson = (person) => {
    setSelectedPayeeId(person._id);
    setSelectedPayeeName(person.name);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Info */}
        {groupId && groupName ? (
          <View style={styles.groupBanner}>
            <Icon source="account-group" size={20} color="#6366F1" />
            <Text style={styles.groupBannerText}>Settling in {groupName}</Text>
          </View>
        ) : null}

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{"\u20B9"}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
              autoFocus={!suggestedAmount}
            />
          </View>
        </View>

        {/* Person Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="account" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Paying To</Text>
          </View>

          {people.length === 0 ? (
            <View style={styles.emptyPeople}>
              <Icon source="account-off" size={40} color="#9CA3AF" />
              <Text style={styles.emptyPeopleText}>No people available</Text>
            </View>
          ) : (
            people.map((person) => {
              const isSelected = selectedPayeeId === person._id;
              const avatarColor = getAvatarColor(person.name);
              return (
                <TouchableOpacity
                  key={person._id}
                  style={[styles.personItem, isSelected && styles.personItemSelected]}
                  onPress={() => selectPerson(person)}
                >
                  <View style={[styles.personAvatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.personAvatarText}>
                      {person.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.personName, isSelected && styles.personNameSelected]}>
                    {person.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <Icon source="check-circle" size={24} color="#6366F1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Note */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="note-text" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Note (Optional)</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon source="check-circle" size={22} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Record Payment</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  groupBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF2FF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  groupBannerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366F1",
  },
  amountSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: "700",
    color: "#6366F1",
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1A1A1A",
    minWidth: 120,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  personItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  personItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  personAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  personName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  personNameSelected: {
    color: "#6366F1",
  },
  selectedCheck: {
    marginLeft: 8,
  },
  emptyPeople: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyPeopleText: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 8,
  },
  noteInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
