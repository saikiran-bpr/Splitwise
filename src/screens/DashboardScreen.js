// src/screens/DashboardScreen.js
import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function DashboardScreen({ navigation }) {
  const { groups, getTotalBalance, getRecentActivity, getUserName, loading, refreshData, refreshing } = useContext(DataContext);
  const { user, logout } = useContext(AuthContext);

  const { totalOwed, totalOwing } = getTotalBalance();
  const recentActivity = getRecentActivity().slice(0, 5);

  const handleSignOut = () => {
    logout();
  };

  const renderActivityItem = (activity) => {
    if (activity.type === "expense") {
      return (
        <View key={activity.id} style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: "#EEF2FF" }]}>
            <Icon source="cash" size={24} color="#6366F1" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>
              <Text style={styles.activityBold}>{getUserName(activity.paidBy)}</Text> added{" "}
              <Text style={styles.activityBold}>₹{activity.amount.toFixed(2)}</Text> in{" "}
              <Text style={styles.activityBold}>{activity.groupName}</Text>
            </Text>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            <Text style={styles.activityDate}>
              {new Date(activity.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      );
    } else {
      return (
        <View key={activity.id} style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: "#D1FAE5" }]}>
            <Icon source="check-circle" size={24} color="#10B981" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>
              <Text style={styles.activityBold}>{getUserName(activity.fromUserId)}</Text> settled{" "}
              <Text style={styles.activityBold}>₹{activity.amount.toFixed(2)}</Text> with{" "}
              <Text style={styles.activityBold}>{getUserName(activity.toUserId)}</Text>
            </Text>
            <Text style={styles.activityDate}>
              {new Date(activity.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshData}
          colors={["#6366F1"]}
          tintColor="#6366F1"
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {user?.name || user?.email?.split("@")[0]}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Icon source="logout" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <View style={styles.statIconContainer}>
            <Icon source="arrow-down" size={24} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statLabel}>You are owed</Text>
            <Text style={styles.statAmountGreen}>₹{totalOwed.toFixed(2)}</Text>
          </View>
        </View>
        <View style={[styles.statCard, styles.statCardRed]}>
          <View style={styles.statIconContainer}>
            <Icon source="arrow-up" size={24} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.statLabel}>You owe</Text>
            <Text style={styles.statAmountRed}>₹{totalOwing.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Groups")}
        >
          <Icon source="account-group" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>View Groups ({groups.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon source="clock-outline" size={20} color="#6366F1" />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {recentActivity.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon source="inbox" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          recentActivity.map(activity => renderActivityItem(activity))
        )}
      </View>
    </ScrollView>
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6C757D",
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statCardGreen: {
    borderColor: "#D1FAE5",
    backgroundColor: "#F0FDF4",
  },
  statCardRed: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6C757D",
    marginBottom: 4,
  },
  statAmountGreen: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  statAmountRed: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
  activityItem: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
  },
  activityBold: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  activityDescription: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: "#ADB5BD",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 12,
  },
});
