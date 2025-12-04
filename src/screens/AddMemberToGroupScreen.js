// src/screens/AddMemberToGroupScreen.js
import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { DataContext } from "../context/DataContext";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function AddMemberToGroupScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { friends, groups, addMemberToGroup } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const group = groups.find(g => g.id === groupId);
  
  // Filter out friends who are already in the group
  const availableFriends = friends.filter(friend => 
    !group?.members?.includes(friend.id)
  );

  const toggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert("Validation", "Please select at least one friend to add.");
      return;
    }

    setLoading(true);
    try {
      await addMemberToGroup(groupId, selectedFriends);
      Alert.alert("Success", "Members added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Error adding members:", err);
      Alert.alert("Error", err.message || "Failed to add members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderFriend = ({ item }) => {
    const isSelected = selectedFriends.includes(item.id);
    const avatarColor = getAvatarColor(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => toggleFriend(item.id)}
      >
        <View style={styles.friendContent}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendEmail}>{item.email}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Members</Text>
          <Text style={styles.subtitle}>Add friends to {group.name}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Icon source="account-multiple" size={18} color="#6366F1" />
              <Text style={styles.label}>Select Friends</Text>
            </View>
            <Text style={styles.hint}>
              {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
            </Text>
          </View>

          {availableFriends.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon source="account-multiple-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No friends available</Text>
              <Text style={styles.emptySubtext}>
                {friends.length === 0 
                  ? "Add friends first to add them to the group"
                  : "All your friends are already in this group"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableFriends}
              keyExtractor={(item) => item.id}
              renderItem={renderFriend}
              style={styles.friendsList}
              contentContainerStyle={styles.friendsListContent}
            />
          )}

          <TouchableOpacity
            style={[styles.button, (loading || selectedFriends.length === 0) && styles.buttonDisabled]}
            onPress={handleAddMembers}
            disabled={loading || selectedFriends.length === 0}
          >
            <Icon source="account-plus" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? "Adding..." : `Add ${selectedFriends.length} Member${selectedFriends.length !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
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
  form: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  hint: {
    fontSize: 13,
    color: "#6C757D",
    marginTop: 4,
  },
  friendsList: {
    flex: 1,
    marginBottom: 20,
  },
  friendsListContent: {
    paddingBottom: 8,
  },
  friendItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  friendItemSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  friendContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: "#6C757D",
  },
  button: {
    backgroundColor: "#6366F1",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
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

