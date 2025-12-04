// src/screens/GroupDetailScreen.js
import React, { useContext, useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, RefreshControl } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { groups, calculateBalances, calculatePairwiseBalance, getUserName, deleteExpense, settleUp, refreshData, refreshing } = useContext(DataContext);
  const { user } = useContext(AuthContext);

  const group = groups.find(g => g.id === groupId);
  const balances = group ? calculateBalances(groupId) : {};

  useLayoutEffect(() => {
    navigation.setOptions({
      title: group?.name || "Group",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("AddExpense", { groupId })}
          style={styles.addButton}
        >
          <Icon source="plus-circle" size={24} color="#6366F1" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, group]);

  const handleSettleUp = (fromUserId, toUserId, amount) => {
    Alert.alert(
      "Settle Up",
      `${getUserName(fromUserId)} will settle ₹${Math.abs(amount).toFixed(2)} with ${getUserName(toUserId)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await settleUp(groupId, fromUserId, toUserId, Math.abs(amount));
            Alert.alert("Success", "Payment settled!");
          },
        },
      ]
    );
  };

  const handleDeleteExpense = (expenseId, description) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteExpense(groupId, expenseId);
          },
        },
      ]
    );
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  const renderExpense = ({ item }) => {
    const splitAmount = item.amount / item.splitBetween.length;
    const paidByName = getUserName(item.paidBy);
    const date = item.date?.toDate ? item.date.toDate().toLocaleDateString() : new Date(item.date).toLocaleDateString();
    const isPaidByUser = item.paidBy === user?.uid;

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <View style={styles.expenseTitleRow}>
              <Icon source="receipt" size={20} color="#6366F1" />
              <Text style={styles.expenseDescription}>{item.description}</Text>
            </View>
            <Text style={styles.expenseDate}>{date}</Text>
          </View>
          <View style={styles.expenseAmountContainer}>
            <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
            {isPaidByUser && (
              <TouchableOpacity
                onPress={() => handleDeleteExpense(item.id, item.description)}
                style={styles.deleteButton}
              >
                <Icon source="delete" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.expenseFooter}>
          <View style={styles.expenseFooterItem}>
            <Icon source="account" size={16} color="#6C757D" />
            <Text style={styles.expensePaidBy}>
              Paid by <Text style={styles.expensePaidByName}>{paidByName}</Text>
            </Text>
          </View>
          <View style={styles.expenseFooterItem}>
            <Icon source="account-multiple" size={16} color="#6C757D" />
            <Text style={styles.expenseSplit}>
              ₹{splitAmount.toFixed(2)} per person
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBalance = (memberId) => {
    const isCurrentUser = memberId === user?.uid;
    const name = getUserName(memberId);
    
    // Calculate pairwise balance between current user and this member
    // Positive: member owes current user
    // Negative: current user owes member
    const netBalance = isCurrentUser 
      ? balances[user?.uid] || 0  // For current user, show their overall balance
      : calculatePairwiseBalance(groupId, user?.uid, memberId);
    
    if (netBalance === 0 && !isCurrentUser) return null;

    const balanceColor = netBalance > 0 ? "#10B981" : netBalance < 0 ? "#EF4444" : "#6B7280";
    const balanceText = netBalance > 0
      ? `owes you ₹${Math.abs(netBalance).toFixed(2)}`
      : netBalance < 0
      ? `you owe ₹${Math.abs(netBalance).toFixed(2)}`
      : "settled up";

    return (
      <View key={memberId} style={styles.balanceItem}>
        <View style={styles.balanceInfo}>
          <View style={styles.balanceNameRow}>
            <Icon 
              source={netBalance > 0 ? "arrow-down" : netBalance < 0 ? "arrow-up" : "check-circle"} 
              size={20} 
              color={balanceColor} 
            />
            <Text style={styles.balanceName}>{name}</Text>
          </View>
          <Text style={[styles.balanceAmount, { color: balanceColor }]}>
            {balanceText}
          </Text>
        </View>
        {netBalance !== 0 && !isCurrentUser && (
          <TouchableOpacity
            style={[styles.settleButton, netBalance < 0 && styles.settleButtonActive]}
            onPress={() => {
              if (netBalance < 0) {
                // User owes member, so user pays member
                handleSettleUp(user?.uid, memberId, Math.abs(netBalance));
              } else {
                // Member owes user, so member pays user
                handleSettleUp(memberId, user?.uid, Math.abs(netBalance));
              }
            }}
          >
            <Icon 
              source={netBalance < 0 ? "check-circle" : "bell"} 
              size={16} 
              color={netBalance < 0 ? "#FFFFFF" : "#6B7280"} 
            />
            <Text style={[styles.settleButtonText, netBalance < 0 && { color: "#FFFFFF" }]}>
              {netBalance < 0 ? "Settle Up" : "Request"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        <View style={styles.balancesSection}>
          <View style={styles.sectionHeader}>
            <Icon source="account-balance-wallet" size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Balances</Text>
          </View>
          <TouchableOpacity
            style={styles.addMemberButton}
            onPress={() => navigation.navigate("AddMember", { groupId })}
          >
            <Icon source="account-plus" size={18} color="#6366F1" />
            <Text style={styles.addMemberButtonText}>Add Members</Text>
          </TouchableOpacity>
          {group.members.map(memberId => renderBalance(memberId))}
          {Object.values(balances).every(b => b === 0) && (
            <View style={styles.settledContainer}>
              <Icon source="check-circle" size={32} color="#10B981" />
              <Text style={styles.settledText}>All settled up!</Text>
            </View>
          )}
        </View>

        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Icon source="receipt" size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>
              Expenses ({group.expenses.length})
            </Text>
          </View>
          {group.expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon source="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add an expense to get started</Text>
            </View>
          ) : (
            <FlatList
              data={group.expenses}
              keyExtractor={(item) => item.id}
              renderItem={renderExpense}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  addButton: {
    marginRight: 8,
    padding: 4,
  },
  balancesSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  expensesSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6366F1",
    borderStyle: "dashed",
  },
  addMemberButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366F1",
  },
  balanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  balanceInfo: {
    flex: 1,
  },
  balanceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  balanceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  settleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settleButtonActive: {
    backgroundColor: "#6366F1",
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  settledContainer: {
    padding: 20,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
    gap: 8,
  },
  settledText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
  },
  expenseCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  expenseDescription: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  expenseDate: {
    fontSize: 13,
    color: "#6C757D",
  },
  expenseAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366F1",
  },
  deleteButton: {
    padding: 4,
  },
  expenseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  expenseFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expensePaidBy: {
    fontSize: 14,
    color: "#6C757D",
  },
  expensePaidByName: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  expenseSplit: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
  },
});
