// src/screens/GroupsScreen.js
import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";

export default function GroupsScreen({ navigation }) {
  const { groups, calculateBalances, getUserName, refreshData, refreshing } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderGroup = ({ item }) => {
    const balances = calculateBalances(item.id);
    const userBalance = balances[user?.uid] || 0;
    const balanceColor = userBalance > 0 ? "#10B981" : userBalance < 0 ? "#EF4444" : "#6B7280";
    const balanceText = userBalance > 0 
      ? `You are owed ₹${Math.abs(userBalance).toFixed(2)}`
      : userBalance < 0 
      ? `You owe ₹${Math.abs(userBalance).toFixed(2)}`
      : "Settled up";
    const groupColor = getGroupColor(item.name);

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
      >
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: groupColor }]}>
            <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {item.members.length} member{item.members.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.groupFooter}>
          <View style={[styles.balanceBadge, { backgroundColor: balanceColor === "#10B981" ? "#D1FAE5" : balanceColor === "#EF4444" ? "#FEE2E2" : "#F3F4F6" }]}>
            <Text style={[styles.balanceText, { color: balanceColor }]}>
              {balanceText}
            </Text>
          </View>
          <Text style={styles.expenseCount}>
            {item.expenses.length} expense{item.expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Text style={styles.subtitle}>{groups.length} group{groups.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchQuery ? "No groups found" : "No groups yet"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? "Try a different search" : "Create a group to start splitting expenses"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
              colors={["#6366F1"]}
              tintColor="#6366F1"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginTop: 40,

  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
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
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  searchInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  list: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  groupIconText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: "#6C757D",
  },
  groupFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F5",
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  expenseCount: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
  },
});
