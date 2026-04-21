// src/screens/ExpenseDetailScreen.js
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

const getCategoryIcon = (category) => {
  switch (category) {
    case "food":
      return "food";
    case "transport":
    case "transportation":
      return "car";
    case "shopping":
      return "shopping";
    case "entertainment":
      return "movie-open";
    case "utilities":
      return "flash";
    case "rent":
    case "housing":
      return "home";
    case "health":
    case "medical":
      return "medical-bag";
    case "travel":
      return "airplane";
    default:
      return "receipt";
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case "food":
      return { color: "#F59E0B", bg: "#FEF3C7" };
    case "transport":
    case "transportation":
      return { color: "#6366F1", bg: "#EEF2FF" };
    case "shopping":
      return { color: "#EC4899", bg: "#FCE7F3" };
    case "entertainment":
      return { color: "#8B5CF6", bg: "#EDE9FE" };
    case "utilities":
      return { color: "#F59E0B", bg: "#FEF3C7" };
    case "rent":
    case "housing":
      return { color: "#10B981", bg: "#D1FAE5" };
    case "health":
    case "medical":
      return { color: "#EF4444", bg: "#FEE2E2" };
    case "travel":
      return { color: "#0EA5E9", bg: "#E0F2FE" };
    default:
      return { color: "#6C757D", bg: "#F1F3F5" };
  }
};

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expenseId } = route.params;
  const { user } = useContext(AuthContext);
  const { getExpenseDetail, addComment, deleteComment, deleteExpense } = useContext(DataContext);

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(false);

  useEffect(() => {
    loadExpense();
  }, [expenseId]);

  const loadExpense = async () => {
    setLoading(true);
    try {
      const data = await getExpenseDetail(expenseId);
      setExpense(data);
    } catch (error) {
      console.error("Error loading expense:", error.message);
      Alert.alert("Error", "Failed to load expense details.");
    } finally {
      setLoading(false);
    }
  };

  const isOwner =
    user?._id === expense?.paidBy?._id || user?._id === expense?.createdBy?._id;

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      const updatedComments = await addComment(expenseId, text);
      setExpense((prev) => ({
        ...prev,
        comments: updatedComments || prev.comments,
      }));
      setCommentText("");
      // Reload to get fresh data if comments weren't returned properly
      if (!updatedComments) {
        await loadExpense();
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComment(expenseId, commentId);
            setExpense((prev) => ({
              ...prev,
              comments: (prev.comments || []).filter((c) => c._id !== commentId),
            }));
          } catch (error) {
            Alert.alert("Error", error.message || "Failed to delete comment.");
          }
        },
      },
    ]);
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${expense?.description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingExpense(true);
            try {
              await deleteExpense(expenseId);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete expense.");
              setDeletingExpense(false);
            }
          },
        },
      ]
    );
  };

  const handleEditExpense = () => {
    navigation.navigate("EditExpense", {
      expenseId: expense._id,
      groupId: expense.group?._id || expense.groupId,
    });
  };

  const getAvatarColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = (name || "U").charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCommentTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getSplitTypeLabel = (splitType) => {
    switch (splitType) {
      case "equal":
        return "Split equally";
      case "exact":
        return "Split by exact amounts";
      case "percentage":
        return "Split by percentage";
      default:
        return splitType || "Equal split";
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon source="alert-circle-outline" size={56} color="#9CA3AF" />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  const category = expense.category || "other";
  const catIcon = getCategoryIcon(category);
  const catColor = getCategoryColor(category);
  const comments = expense.comments || [];
  const splits = expense.splits || expense.splitDetails || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Main Info Card */}
        <View style={styles.mainCard}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
            <Icon source={catIcon} size={20} color={catColor.color} />
            <Text style={[styles.categoryText, { color: catColor.color }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </View>

          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.amount}>{"\u20B9"}{Number(expense.amount).toFixed(2)}</Text>

          <View style={styles.metaRow}>
            <Icon source="calendar" size={16} color="#6C757D" />
            <Text style={styles.metaText}>{formatDate(expense.date || expense.createdAt)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Icon source="swap-horizontal" size={16} color="#6C757D" />
            <Text style={styles.metaText}>{getSplitTypeLabel(expense.splitType)}</Text>
          </View>
        </View>

        {/* Paid By Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="account-cash" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Paid By</Text>
          </View>
          <View style={styles.paidByRow}>
            <View
              style={[
                styles.paidByAvatar,
                { backgroundColor: getAvatarColor(expense.paidBy?.name || "U") },
              ]}
            >
              <Text style={styles.paidByAvatarText}>
                {(expense.paidBy?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.paidByInfo}>
              <Text style={styles.paidByName}>
                {expense.paidBy?._id === user?._id ? "You" : expense.paidBy?.name || "Unknown"}
              </Text>
              <Text style={styles.paidByAmount}>
                paid {"\u20B9"}{Number(expense.amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Split Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="chart-pie" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Split Breakdown</Text>
          </View>
          {splits.length === 0 ? (
            <Text style={styles.noDataText}>No split details available</Text>
          ) : (
            splits.map((split, index) => {
              const splitUser = split.user || split;
              const splitName = splitUser?.name || splitUser?.email || "Unknown";
              const splitAmount = split.amount || split.share || 0;
              const isCurrentUser = splitUser?._id === user?._id;
              return (
                <View key={splitUser?._id || index} style={styles.splitItem}>
                  <View
                    style={[
                      styles.splitAvatar,
                      { backgroundColor: getAvatarColor(splitName) },
                    ]}
                  >
                    <Text style={styles.splitAvatarText}>
                      {splitName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.splitName}>
                    {isCurrentUser ? "You" : splitName}
                  </Text>
                  <Text style={styles.splitAmount}>
                    {"\u20B9"}{Number(splitAmount).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Notes */}
        {expense.notes ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon source="note-text" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{expense.notes}</Text>
          </View>
        ) : null}

        {/* Comments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon source="comment-multiple" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>
              Comments {comments.length > 0 ? `(${comments.length})` : ""}
            </Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Icon source="comment-off-outline" size={36} color="#D1D5DB" />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
            </View>
          ) : (
            comments.map((comment) => {
              const commentUser = comment.user || {};
              const isOwnComment = commentUser._id === user?._id;
              return (
                <View key={comment._id} style={styles.commentItem}>
                  <View
                    style={[
                      styles.commentAvatar,
                      { backgroundColor: getAvatarColor(commentUser.name || "U") },
                    ]}
                  >
                    <Text style={styles.commentAvatarText}>
                      {(commentUser.name || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUserName}>
                        {isOwnComment ? "You" : commentUser.name || "Unknown"}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatCommentTime(comment.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                  {isOwnComment && (
                    <TouchableOpacity
                      style={styles.commentDeleteButton}
                      onPress={() => handleDeleteComment(comment._id)}
                    >
                      <Icon source="delete-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          {/* Add Comment Input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!commentText.trim() || submittingComment) && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon source="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons (only for owner) */}
        {isOwner && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditExpense}>
              <Icon source="pencil" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, deletingExpense && { opacity: 0.7 }]}
              onPress={handleDeleteExpense}
              disabled={deletingExpense}
            >
              {deletingExpense ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon source="delete" size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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
  errorText: {
    fontSize: 16,
    color: "#6C757D",
    marginTop: 12,
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
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
  paidByRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paidByAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  paidByAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  paidByInfo: {
    flex: 1,
  },
  paidByName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  paidByAmount: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 12,
  },
  splitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  splitAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  splitAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  splitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#495057",
  },
  notesText: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  commentTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  commentText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  commentDeleteButton: {
    padding: 6,
    marginLeft: 4,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#C7D2FE",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtons: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
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
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
