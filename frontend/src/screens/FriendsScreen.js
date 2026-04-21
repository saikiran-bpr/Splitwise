// src/screens/FriendsScreen.js
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function FriendsScreen({ navigation }) {
  const { friends, fetchFriends, removeFriend, loading } =
    useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFriends();
  }, []);

  const filteredFriends = (friends ?? []).filter(
    (friend) =>
      (friend.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarColor = (name) => {
    const colors = [
      "#6366F1",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
    ];
    const index = (name ?? "A").charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleDeleteFriend = (friend) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friend.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend(friend._id);
            } catch (err) {
              Alert.alert("Error", "Failed to remove friend. Please try again.");
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }) => {
    const avatarColor = getAvatarColor(item.name);

    return (
      <TouchableOpacity
        style={styles.friendCard}
        onLongPress={() => handleDeleteFriend(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>
            {(item.name ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
          {item.phone ? (
            <Text style={styles.friendPhone}>{item.phone}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteFriend(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon source="close-circle-outline" size={22} color="#ADB5BD" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Friends</Text>
          <Text style={styles.subtitle}>
            {(friends ?? []).length} friend
            {(friends ?? []).length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButtonHeader}
          onPress={() => navigation.navigate("AddFriend")}
        >
          <Icon source="account-plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonHeaderText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon
            source={searchQuery ? "magnify" : "account-group-outline"}
            size={48}
            color="#9CA3AF"
          />
          <Text style={styles.emptyText}>
            {searchQuery ? "No friends found" : "No friends added yet"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Try a different search"
              : "Add friends to start splitting expenses"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => navigation.navigate("AddFriend")}
            >
              <Text style={styles.emptyAddButtonText}>Add Your First Friend</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item._id}
          renderItem={renderFriend}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddFriend")}
        activeOpacity={0.8}
      >
        <Icon source="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  addButtonHeader: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonHeaderText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
    paddingBottom: 80,
  },
  friendCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: "#6C757D",
  },
  friendPhone: {
    fontSize: 13,
    color: "#ADB5BD",
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyAddButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
