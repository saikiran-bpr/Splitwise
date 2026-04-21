// src/screens/ProfileScreen.js
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

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "CNY"];

export default function ProfileScreen() {
  const { user, logout, updateProfile, changePassword } = useContext(AuthContext);
  const { balances, fetchBalances, friends, fetchFriends, groups } = useContext(DataContext);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || "INR");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setSelectedCurrency(user.currency || "INR");
    }
  }, [user]);

  const loadData = async () => {
    try {
      await Promise.all([fetchFriends(), fetchBalances()]);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (userName) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = (userName || "U").charCodeAt(0) % colors.length;
    return colors[index];
  };

  const netBalance = (balances?.totalOwed ?? 0) - (balances?.totalOwe ?? 0);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), currency: selectedCurrency });
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }
    if (!newPassword) {
      Alert.alert("Error", "Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password changed successfully.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const avatarColor = getAvatarColor(user?.name);
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: "#EEF2FF" }]}>
              <Icon source="account-group" size={22} color="#6366F1" />
            </View>
            <Text style={styles.statValue}>{groups?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: "#EDE9FE" }]}>
              <Icon source="account-multiple" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{friends?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: netBalance >= 0 ? "#D1FAE5" : "#FEE2E2" }]}>
              <Icon
                source={netBalance >= 0 ? "arrow-down" : "arrow-up"}
                size={22}
                color={netBalance >= 0 ? "#10B981" : "#EF4444"}
              />
            </View>
            <Text style={[styles.statValue, { color: netBalance >= 0 ? "#10B981" : "#EF4444" }]}>
              {netBalance >= 0 ? "+" : "-"}{Math.abs(netBalance).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Net Balance</Text>
          </View>
        </View>

        {/* Edit Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="account-edit" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Edit Profile</Text>
          </View>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />

          {/* Currency Preference */}
          <Text style={styles.inputLabel}>Currency</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.currencyScroll}
            contentContainerStyle={styles.currencyContainer}
          >
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyChip,
                  selectedCurrency === currency && styles.currencyChipSelected,
                ]}
                onPress={() => setSelectedCurrency(currency)}
              >
                <Text
                  style={[
                    styles.currencyChipText,
                    selectedCurrency === currency && styles.currencyChipTextSelected,
                  ]}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon source="content-save" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="lock" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.saveButton, savingPassword && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon source="lock-check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Change Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Icon source="logout" size={20} color="#FFFFFF" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
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
    marginTop: 40,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLargeText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6C757D",
  },
  statsContainer: {
    flexDirection: "row",
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
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6C757D",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 4,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  currencyScroll: {
    marginBottom: 16,
  },
  currencyContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currencyChipSelected: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  currencyChipTextSelected: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
