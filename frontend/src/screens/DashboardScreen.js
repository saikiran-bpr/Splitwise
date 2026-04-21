// src/screens/DashboardScreen.js
import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function DashboardScreen({ navigation }) {
  const { balances, activities, loading, refreshData, refreshing } =
    useContext(DataContext);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    refreshData();
  }, []);

  const totalOwed = balances?.totalOwed ?? 0;
  const totalOwe = balances?.totalOwe ?? 0;
  const netBalance = totalOwed - totalOwe;

  const recentActivity = (activities ?? []).slice(0, 5);

  const handleSignOut = () => {
    logout();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "expense_added":
        return { icon: "cash", color: "#6366F1", bg: "#EEF2FF" };
      case "settlement_added":
        return { icon: "check-circle", color: "#10B981", bg: "#D1FAE5" };
      case "group_created":
        return { icon: "account-group", color: "#F59E0B", bg: "#FEF3C7" };
      case "friend_added":
        return { icon: "account-plus", color: "#8B5CF6", bg: "#EDE9FE" };
      default:
        return { icon: "bell", color: "#6C757D", bg: "#F1F3F5" };
    }
  };

  const getActivityText = (activity) => {
    const { type, actor, metadata } = activity;
    const actorName = actor?.name ?? "Someone";
    const amount = metadata?.amount != null ? `₹${Number(metadata.amount).toFixed(2)}` : "";
    const description = metadata?.description ?? "";
    const targetUserName = metadata?.targetUserName ?? "";
    const groupName = metadata?.groupName ?? activity.group?.name ?? "";

    switch (type) {
      case "expense_added":
        return { primary: `${actorName} added ${amount} for "${description}"`, secondary: groupName ? `in ${groupName}` : "" };
      case "settlement_added":
        return { primary: `${actorName} settled ${amount} with ${targetUserName}`, secondary: groupName ? `in ${groupName}` : "" };
      case "group_created":
        return { primary: `${actorName} created group "${groupName}"`, secondary: "" };
      case "friend_added":
        return { primary: `${actorName} added ${targetUserName} as a friend`, secondary: "" };
      default:
        return { primary: `${actorName} performed an action`, secondary: "" };
    }
  };

  const renderActivityItem = (activity, index) => {
    const { icon, color, bg } = getActivityIcon(activity.type);
    const { primary, secondary } = getActivityText(activity);
    const key = activity._id ?? `activity-${index}`;

    return (
      <View key={key} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: bg }]}>
          <Icon source={icon} size={24} color={color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>{primary}</Text>
          {secondary ? (
            <Text style={styles.activityDescription}>{secondary}</Text>
          ) : null}
          <Text style={styles.activityDate}>
            {new Date(activity.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
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
          <Text style={styles.subtitle}>
            Welcome back, {user?.name || user?.email?.split("@")[0]}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Icon source="logout" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Balance Stat Cards */}
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
            <Text style={styles.statAmountRed}>₹{totalOwe.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Net Balance Card */}
      <View style={styles.netBalanceContainer}>
        <View
          style={[
            styles.netBalanceCard,
            netBalance >= 0 ? styles.netBalancePositive : styles.netBalanceNegative,
          ]}
        >
          <Text style={styles.netBalanceLabel}>Net Balance</Text>
          <Text
            style={[
              styles.netBalanceAmount,
              { color: netBalance >= 0 ? "#10B981" : "#EF4444" },
            ]}
          >
            {netBalance >= 0 ? "+" : "-"}₹{Math.abs(netBalance).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Groups")}
        >
          <Icon source="account-group" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>View Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate("Groups")}
        >
          <Icon source="plus-circle" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
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
          recentActivity.map((activity, index) =>
            renderActivityItem(activity, index)
          )
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
  netBalanceContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  netBalanceCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  netBalancePositive: {
    borderColor: "#D1FAE5",
    backgroundColor: "#F0FDF4",
  },
  netBalanceNegative: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  netBalanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6C757D",
    marginBottom: 4,
  },
  netBalanceAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
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
  actionButtonSecondary: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
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
