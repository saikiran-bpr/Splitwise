// src/screens/ActivityScreen.js
import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Icon } from "react-native-paper";
import { DataContext } from "../context/DataContext";

const getActivityIcon = (type) => {
  switch (type) {
    case "expense_added":
      return { icon: "cash", color: "#6366F1", bg: "#EEF2FF" };
    case "expense_updated":
      return { icon: "cash-sync", color: "#F59E0B", bg: "#FEF3C7" };
    case "expense_deleted":
      return { icon: "cash-remove", color: "#EF4444", bg: "#FEE2E2" };
    case "settlement_added":
      return { icon: "check-circle", color: "#10B981", bg: "#D1FAE5" };
    case "group_created":
      return { icon: "account-group", color: "#F59E0B", bg: "#FEF3C7" };
    case "member_added":
      return { icon: "account-plus", color: "#8B5CF6", bg: "#EDE9FE" };
    case "member_removed":
      return { icon: "account-minus", color: "#EF4444", bg: "#FEE2E2" };
    case "friend_added":
      return { icon: "account-plus", color: "#10B981", bg: "#D1FAE5" };
    case "comment_added":
      return { icon: "comment-text", color: "#6366F1", bg: "#EEF2FF" };
    default:
      return { icon: "bell", color: "#6C757D", bg: "#F1F3F5" };
  }
};

const getActivityText = (activity) => {
  const { type, actor, group, metadata } = activity;
  const actorName = actor?.name ?? "Someone";
  const amount = metadata?.amount != null ? `\u20B9${Number(metadata.amount).toFixed(2)}` : "";
  const description = metadata?.description ?? "";
  const targetUserName = metadata?.targetUserName ?? "";
  const groupName = metadata?.groupName ?? group?.name ?? "";

  switch (type) {
    case "expense_added":
      return `${actorName} added '${description}' (${amount}) in ${groupName}`;
    case "expense_updated":
      return `${actorName} updated '${description}' in ${groupName}`;
    case "expense_deleted":
      return `${actorName} deleted '${description}' (${amount})`;
    case "settlement_added":
      return `${actorName} settled ${amount} with ${targetUserName}`;
    case "group_created":
      return `${actorName} created group '${groupName}'`;
    case "member_added":
      return `${actorName} added ${targetUserName} to ${groupName}`;
    case "member_removed":
      return `${actorName} removed ${targetUserName} from ${groupName}`;
    case "friend_added":
      return `${actorName} added ${targetUserName} as a friend`;
    case "comment_added":
      return `${actorName} commented on '${description}'`;
    default:
      return `${actorName} performed an action`;
  }
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (activityDate.getTime() === today.getTime()) {
    return "Today";
  } else if (activityDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
};

export default function ActivityScreen() {
  const { activities, fetchActivities } = useContext(DataContext);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setInitialLoading(true);
    try {
      const data = await fetchActivities(1);
      setPage(1);
      setHasMore(data?.pagination?.hasMore ?? (data?.activities?.length === 30));
    } finally {
      setInitialLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchActivities(1);
      setPage(1);
      setHasMore(data?.pagination?.hasMore ?? (data?.activities?.length === 30));
    } finally {
      setRefreshing(false);
    }
  }, [fetchActivities]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchActivities(nextPage);
      setPage(nextPage);
      const newActivities = data?.activities || [];
      setHasMore(data?.pagination?.hasMore ?? (newActivities.length === 30));
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, fetchActivities]);

  const renderActivityItem = ({ item }) => {
    const { icon, color, bg } = getActivityIcon(item.type);
    const text = getActivityText(item);
    const time = getRelativeTime(item.createdAt);

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIconContainer, { backgroundColor: bg }]}>
          <Icon source={icon} size={24} color={color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>{text}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your recent activity feed</Text>
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon source="bell-off-outline" size={56} color="#9CA3AF" />
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptySubtext}>
            When you add expenses, settle up, or join groups, it will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#6366F1"]}
              tintColor="#6366F1"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
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
  center: {
    justifyContent: "center",
    alignItems: "center",
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
  list: {
    padding: 16,
  },
  activityItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
    paddingTop: 2,
  },
  activityText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
    lineHeight: 22,
    marginBottom: 6,
  },
  activityTime: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#6C757D",
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 20,
  },
});
