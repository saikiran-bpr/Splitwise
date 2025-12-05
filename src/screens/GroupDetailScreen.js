// src/screens/GroupDetailScreen.js
import React, { useContext, useLayoutEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, RefreshControl } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { groups, calculateBalances, calculatePairwiseBalance, getUserName, deleteExpense, refreshData, refreshing } = useContext(DataContext);
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

  // Calculate user's total spending in this group
  const getUserTotalSpent = () => {
    if (!group || !user?.uid) return 0;
    return group.expenses
      .filter(expense => expense.paidBy === user.uid)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  // Get people who owe the current user
  const getPeopleWhoOweUser = () => {
    if (!group || !user?.uid) return [];
    const peopleWhoOwe = [];
    
    group.members.forEach(memberId => {
      if (memberId === user.uid) return; // Skip self
      
      const netBalance = calculatePairwiseBalance(groupId, user.uid, memberId);
      if (netBalance > 0) {
        // Positive means member owes user
        peopleWhoOwe.push({
          memberId,
          name: getUserName(memberId),
          amount: netBalance,
        });
      }
    });
    
    return peopleWhoOwe;
  };

  // Get people the current user owes
  const getPeopleUserOwes = () => {
    if (!group || !user?.uid) return [];
    const peopleUserOwes = [];
    
    group.members.forEach(memberId => {
      if (memberId === user.uid) return; // Skip self
      
      const netBalance = calculatePairwiseBalance(groupId, user.uid, memberId);
      if (netBalance < 0) {
        // Negative means user owes member
        peopleUserOwes.push({
          memberId,
          name: getUserName(memberId),
          amount: Math.abs(netBalance),
        });
      }
    });
    
    return peopleUserOwes;
  };

  // Render user's summary section
  const renderUserSummary = () => {
    if (!user?.uid) return null;
    
    const totalSpent = getUserTotalSpent();
    const peopleWhoOwe = getPeopleWhoOweUser();
    const peopleUserOwes = getPeopleUserOwes();
    const allSettled = peopleWhoOwe.length === 0 && peopleUserOwes.length === 0 && totalSpent === 0;

    return (
      <View style={styles.userSummarySection}>
        <View style={styles.userSummaryHeader}>
          <Icon source="account" size={20} color="#6366F1" />
          <Text style={styles.userSummaryTitle}>Your Summary</Text>
        </View>
        
        {totalSpent > 0 && (
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>Total spent:</Text>
            <Text style={styles.summaryAmount}>₹{totalSpent.toFixed(2)}</Text>
          </View>
        )}

        {peopleWhoOwe.length > 0 && (
          <View style={styles.owedSection}>
            <Text style={styles.owedSectionTitle}>People who owe you:</Text>
            {peopleWhoOwe.map(({ memberId, name, amount }) => (
              <View key={memberId} style={styles.owedItem}>
                <Icon source="arrow-down" size={16} color="#10B981" />
                <Text style={styles.owedName}>{name}</Text>
                <Text style={[styles.owedAmount, { color: "#10B981" }]}>
                  ₹{amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {peopleUserOwes.length > 0 && (
          <View style={styles.owedSection}>
            <Text style={styles.owedSectionTitle}>You owe:</Text>
            {peopleUserOwes.map(({ memberId, name, amount }) => (
              <View key={memberId} style={styles.owedItem}>
                <Icon source="arrow-up" size={16} color="#EF4444" />
                <Text style={styles.owedName}>{name}</Text>
                <Text style={[styles.owedAmount, { color: "#EF4444" }]}>
                  ₹{amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {allSettled && (
          <View style={styles.settledIndicator}>
            <Icon source="check-circle" size={16} color="#10B981" />
            <Text style={styles.settledIndicatorText}>All settled up!</Text>
          </View>
        )}
      </View>
    );
  };

  // Render balance for other members (not current user)
  const renderOtherMemberBalance = (memberId) => {
    if (memberId === user?.uid) return null; // Skip current user
    
    const name = getUserName(memberId);
    const netBalance = calculatePairwiseBalance(groupId, user?.uid, memberId);
    
    // Only show if there's a balance
    if (netBalance === 0) return null;

    const balanceColor = netBalance > 0 ? "#10B981" : "#EF4444";
    const balanceText = netBalance > 0
      ? `owes you ₹${Math.abs(netBalance).toFixed(2)}`
      : `you owe ₹${Math.abs(netBalance).toFixed(2)}`;

    return (
      <View key={memberId} style={styles.balanceItem}>
        <View style={styles.balanceInfo}>
          <View style={styles.balanceNameRow}>
            <Icon 
              source={netBalance > 0 ? "arrow-down" : "arrow-up"} 
              size={20} 
              color={balanceColor} 
            />
            <Text style={styles.balanceName}>{name}</Text>
          </View>
          <Text style={[styles.balanceAmount, { color: balanceColor }]}>
            {balanceText}
          </Text>
        </View>
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
          
          {/* User's summary section */}
          {renderUserSummary()}
          
          {/* Other members' balances - only show if there are other members with balances */}
          {group.members.some(memberId => {
            if (memberId === user?.uid) return false;
            const netBalance = calculatePairwiseBalance(groupId, user?.uid, memberId);
            return netBalance !== 0;
          }) && (
            <View style={styles.otherMembersSection}>
              <Text style={styles.otherMembersTitle}>Other Members</Text>
              {group.members.map(memberId => renderOtherMemberBalance(memberId))}
            </View>
          )}
          
          {/* Show all settled message if everything is zero */}
          {Object.values(balances).every(b => b === 0) && 
           getUserTotalSpent() === 0 && (
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
  userSummarySection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  userSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  userSummaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  summaryStat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6C757D",
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
  owedSection: {
    marginBottom: 12,
  },
  owedSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 8,
  },
  owedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 4,
  },
  owedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  owedAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  settledIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },
  settledIndicatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  otherMembersSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  otherMembersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 12,
  },
  balanceItem: {
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
