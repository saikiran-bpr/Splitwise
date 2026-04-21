// src/screens/GroupsScreen.js
import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";

const CATEGORY_ICONS = {
  trip: "✈️",
  home: "🏠",
  couple: "❤️",
  friends: "👥",
  work: "💼",
  other: "📂",
};

export default function GroupsScreen({ navigation }) {
  const { groups, fetchGroups, refreshData, refreshing } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderGroup = ({ item }) => {
    const memberCount = item.members ? item.members.length : 0;
    const groupColor = getGroupColor(item.name);
    const categoryIcon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => navigation.navigate("GroupDetail", { groupId: item._id })}
      >
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: groupColor }]}>
            <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.groupFooter}>
          {item.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <Text style={styles.categoryText}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </View>
          ) : (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>General</Text>
            </View>
          )}
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.groupDescription} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>{groups.length} group{groups.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateGroup")}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>
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
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyCreateButton}
              onPress={() => navigation.navigate("CreateGroup")}
            >
              <Text style={styles.emptyCreateButtonText}>Create Group</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item._id}
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
  headerRow: {
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
  createButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
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
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  memberBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberBadgeText: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  groupDescription: {
    fontSize: 13,
    color: "#6C757D",
    marginTop: 12,
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
    marginBottom: 20,
  },
  emptyCreateButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
