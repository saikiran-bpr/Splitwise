// src/screens/GroupDetailScreen.js
import React, { useContext, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

const CATEGORY_ICONS = {
  food: "🍔",
  transport: "🚗",
  entertainment: "🎬",
  shopping: "🛒",
  utilities: "💡",
  rent: "🏠",
  travel: "✈️",
  health: "🏥",
  education: "📚",
  other: "📋",
};

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { getGroupDetail, getGroupBalances, deleteExpense, settleUp, refreshData, refreshing } = useContext(DataContext);
  const { user } = useContext(AuthContext);

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [detailData, balancesData] = await Promise.all([
        getGroupDetail(groupId),
        getGroupBalances(groupId),
      ]);
      setGroup(detailData.group);
      setExpenses(detailData.expenses || []);
      setSettlements(detailData.settlements || []);
      setBalanceData(balancesData);
    } catch (error) {
      console.error("Error loading group detail:", error);
      Alert.alert("Error", "Failed to load group details.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
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
            try {
              await deleteExpense(expenseId);
              await loadData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete expense.");
            }
          },
        },
      ]
    );
  };

  const handleSettleUp = (debt) => {
    Alert.alert(
      "Settle Up",
      `Record payment of $${debt.amount.toFixed(2)} from ${debt.from.name} to ${debt.to.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Settle",
          onPress: async () => {
            try {
              await settleUp({
                groupId,
                paidBy: debt.from._id,
                paidTo: debt.to._id,
                amount: debt.amount,
              });
              await loadData();
              Alert.alert("Success", "Settlement recorded!");
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to settle up.");
            }
          },
        },
      ]
    );
  };

  const getAvatarColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = (name || "U").charCodeAt(0) % colors.length;
    return colors[index];
  };

  const canEditExpense = (expense) => {
    if (!user?._id) return false;
    return expense.paidBy?._id === user._id || expense.createdBy === user._id;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const memberCount = group.members ? group.members.length : 0;
  const totalExpenses = balanceData?.totalExpenses || 0;
  const expenseCount = balanceData?.expenseCount || expenses.length;
  const memberBalances = balanceData?.memberBalances || [];
  const simplifiedDebts = balanceData?.simplifiedDebts || [];

  const renderGroupInfo = () => (
    <View style={styles.groupInfoSection}>
      <View style={styles.groupInfoHeader}>
        <View style={[styles.groupAvatar, { backgroundColor: getAvatarColor(group.name) }]}>
          <Text style={styles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.groupInfoContent}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{memberCount}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{expenseCount}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#6366F1" }]}>${totalExpenses.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );

  const renderBalances = () => (
    <View style={styles.balancesSection}>
      <View style={styles.sectionHeader}>
        <Icon source="wallet" size={22} color="#6366F1" />
        <Text style={styles.sectionTitle}>Balances</Text>
      </View>
      {memberBalances.length === 0 ? (
        <View style={styles.settledContainer}>
          <Icon source="check-circle" size={32} color="#10B981" />
          <Text style={styles.settledText}>All settled up!</Text>
        </View>
      ) : (
        memberBalances.map((item, index) => {
          const balanceAmount = item.amount || 0;
          const balanceColor = balanceAmount > 0 ? "#10B981" : balanceAmount < 0 ? "#EF4444" : "#6B7280";
          const userName = item.user?.name || "Unknown";
          const isCurrentUser = item.user?._id === user?._id;

          return (
            <View key={item.user?._id || index} style={styles.balanceItem}>
              <View style={styles.balanceInfo}>
                <View style={[styles.balanceAvatar, { backgroundColor: getAvatarColor(userName) }]}>
                  <Text style={styles.balanceAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.balanceName}>
                  {isCurrentUser ? "You" : userName}
                </Text>
              </View>
              <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                {balanceAmount > 0 ? "+" : ""}{balanceAmount.toFixed(2)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  const renderSimplifiedDebts = () => {
    if (simplifiedDebts.length === 0) return null;

    return (
      <View style={styles.debtsSection}>
        <View style={styles.sectionHeader}>
          <Icon source="swap-horizontal" size={22} color="#6366F1" />
          <Text style={styles.sectionTitle}>Simplified Debts</Text>
        </View>
        {simplifiedDebts.map((debt, index) => {
          const fromName = debt.from?.name || "Unknown";
          const toName = debt.to?.name || "Unknown";
          const isFromCurrentUser = debt.from?._id === user?._id;
          const isToCurrentUser = debt.to?._id === user?._id;

          return (
            <View key={index} style={styles.debtItem}>
              <View style={styles.debtInfo}>
                <Text style={styles.debtText}>
                  <Text style={styles.debtName}>{isFromCurrentUser ? "You" : fromName}</Text>
                  {" owes "}
                  <Text style={styles.debtName}>{isToCurrentUser ? "You" : toName}</Text>
                </Text>
                <Text style={styles.debtAmount}>${debt.amount.toFixed(2)}</Text>
              </View>
              {(isFromCurrentUser || isToCurrentUser) && (
                <TouchableOpacity
                  style={styles.settleButton}
                  onPress={() => handleSettleUp(debt)}
                >
                  <Text style={styles.settleButtonText}>Settle</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderExpense = ({ item }) => {
    const paidByName = item.paidBy?.name || "Unknown";
    const isPaidByUser = item.paidBy?._id === user?._id;
    const splitPerPerson = item.splits?.length > 0
      ? (item.amount / item.splits.length).toFixed(2)
      : item.amount?.toFixed(2);
    const categoryIcon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;
    const date = item.date
      ? new Date(item.date).toLocaleDateString()
      : item.createdAt
        ? new Date(item.createdAt).toLocaleDateString()
        : "";

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <View style={styles.expenseTitleRow}>
              <Text style={styles.expenseCategoryIcon}>{categoryIcon}</Text>
              <Text style={styles.expenseDescription}>{item.description}</Text>
            </View>
            <Text style={styles.expenseDate}>{date}</Text>
          </View>
          <View style={styles.expenseAmountContainer}>
            <Text style={styles.expenseAmount}>${item.amount?.toFixed(2)}</Text>
            {canEditExpense(item) && (
              <View style={styles.expenseActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("EditExpense", { groupId, expenseId: item._id })}
                  style={styles.editButton}
                >
                  <Icon source="pencil" size={18} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(item._id, item.description)}
                  style={styles.deleteButton}
                >
                  <Icon source="delete" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={styles.expenseFooter}>
          <View style={styles.expenseFooterItem}>
            <Icon source="account" size={16} color="#6C757D" />
            <Text style={styles.expensePaidBy}>
              Paid by{" "}
              <Text style={styles.expensePaidByName}>
                {isPaidByUser ? "You" : paidByName}
              </Text>
            </Text>
          </View>
          <View style={styles.expenseFooterItem}>
            <Icon source="account-multiple" size={16} color="#6C757D" />
            <Text style={styles.expenseSplit}>
              ${splitPerPerson}/person
            </Text>
          </View>
        </View>
        {item.splitType && item.splitType !== "equal" && (
          <View style={styles.splitTypeBadge}>
            <Text style={styles.splitTypeText}>
              {item.splitType.charAt(0).toUpperCase() + item.splitType.slice(1)} split
            </Text>
          </View>
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
            refreshing={refreshing || loading}
            onRefresh={handleRefresh}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        {renderGroupInfo()}
        {renderBalances()}
        {renderSimplifiedDebts()}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.addMemberButton}
            onPress={() => navigation.navigate("AddMember", { groupId })}
          >
            <Icon source="account-plus" size={18} color="#6366F1" />
            <Text style={styles.addMemberButtonText}>Add Members</Text>
          </TouchableOpacity>
        </View>

        {/* Expenses Section */}
        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Icon source="receipt" size={22} color="#6366F1" />
            <Text style={styles.sectionTitle}>
              Expenses ({expenseCount})
            </Text>
          </View>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon source="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add an expense to get started</Text>
            </View>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(item) => item._id}
              renderItem={renderExpense}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSettle]}
          onPress={() => {
            if (simplifiedDebts.length === 0) {
              Alert.alert("Info", "No debts to settle.");
            } else {
              navigation.navigate("SettleUp", { groupId, debts: simplifiedDebts });
            }
          }}
        >
          <Icon source="handshake" size={22} color="#10B981" />
          <Text style={styles.fabSettleText}>Settle Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.fabAdd]}
          onPress={() => navigation.navigate("AddExpense", { groupId, members: group.members })}
        >
          <Icon source="plus" size={22} color="#FFFFFF" />
          <Text style={styles.fabAddText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
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

  // Group Info
  groupInfoSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  groupInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  groupAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  groupInfoContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E9ECEF",
    marginHorizontal: 8,
  },

  // Balances
  balancesSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
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
  balanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  balanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  balanceAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  balanceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  settledContainer: {
    padding: 20,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  settledText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
  },

  // Simplified Debts
  debtsSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  debtItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  debtInfo: {
    flex: 1,
  },
  debtText: {
    fontSize: 15,
    color: "#6C757D",
    marginBottom: 4,
  },
  debtName: {
    fontWeight: "700",
    color: "#1A1A1A",
  },
  debtAmount: {
    fontSize: 17,
    fontWeight: "700",
    color: "#EF4444",
  },
  settleButton: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },

  // Action Buttons
  actionButtonsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
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

  // Expenses
  expensesSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
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
  expenseCategoryIcon: {
    fontSize: 18,
  },
  expenseDescription: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  expenseDate: {
    fontSize: 13,
    color: "#6C757D",
  },
  expenseAmountContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366F1",
  },
  expenseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButton: {
    padding: 4,
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
  splitTypeBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  splitTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },

  // FABs
  fabContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    gap: 12,
  },
  fab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabSettle: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#10B981",
    shadowColor: "#10B981",
  },
  fabSettleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  fabAdd: {
    backgroundColor: "#6366F1",
    shadowColor: "#6366F1",
  },
  fabAddText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Empty
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
