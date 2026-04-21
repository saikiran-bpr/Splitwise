import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const DataContext = createContext();

export default function DataProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({ totalOwed: 0, totalOwe: 0, netBalance: 0, friendBalances: [] });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      const data = await api.friends.getAll();
      setFriends(data.friends || []);
      return data.friends || [];
    } catch (error) {
      console.error('Error fetching friends:', error.message);
      return [];
    }
  }, []);

  const addFriend = async (email) => {
    const data = await api.friends.add(email);
    setFriends(prev => [...prev, data.friend]);
    return data.friend;
  };

  const removeFriend = async (friendId) => {
    await api.friends.remove(friendId);
    setFriends(prev => prev.filter(f => f._id !== friendId));
  };

  const searchUsers = async (query) => {
    const data = await api.friends.search(query);
    return data.users;
  };

  const fetchGroups = useCallback(async () => {
    try {
      const data = await api.groups.getAll();
      setGroups(data.groups || []);
      return data.groups || [];
    } catch (error) {
      console.error('Error fetching groups:', error.message);
      return [];
    }
  }, []);

  const createGroup = async (name, memberIds, description, category) => {
    const data = await api.groups.create({ name, description, category, memberIds });
    setGroups(prev => [data.group, ...prev]);
    return data.group;
  };

  const getGroupDetail = async (groupId) => {
    const data = await api.groups.getById(groupId);
    return data;
  };

  const updateGroup = async (groupId, updates) => {
    const data = await api.groups.update(groupId, updates);
    setGroups(prev => prev.map(g => g._id === groupId ? data.group : g));
    return data.group;
  };

  const deleteGroup = async (groupId) => {
    await api.groups.delete(groupId);
    setGroups(prev => prev.filter(g => g._id !== groupId));
  };

  const addMemberToGroup = async (groupId, userIds) => {
    const data = await api.groups.addMembers(groupId, userIds);
    setGroups(prev => prev.map(g => g._id === groupId ? data.group : g));
    return data.group;
  };

  const removeMemberFromGroup = async (groupId, userId) => {
    await api.groups.removeMember(groupId, userId);
  };

  const addExpense = async (expenseData) => {
    const data = await api.expenses.create(expenseData);
    return data.expense;
  };

  const updateExpense = async (expenseId, updates) => {
    const data = await api.expenses.update(expenseId, updates);
    return data.expense;
  };

  const deleteExpense = async (expenseId) => {
    await api.expenses.delete(expenseId);
  };

  const getExpenseDetail = async (expenseId) => {
    const data = await api.expenses.getById(expenseId);
    return data.expense;
  };

  const addComment = async (expenseId, text) => {
    const data = await api.expenses.addComment(expenseId, text);
    return data.comments;
  };

  const deleteComment = async (expenseId, commentId) => {
    await api.expenses.deleteComment(expenseId, commentId);
  };

  const settleUp = async (settlementData) => {
    const data = await api.settlements.create(settlementData);
    return data.settlement;
  };

  const fetchBalances = useCallback(async () => {
    try {
      const data = await api.balances.getOverall();
      setBalances(data);
      return data;
    } catch (error) {
      console.error('Error fetching balances:', error.message);
      return balances;
    }
  }, []);

  const getGroupBalances = async (groupId) => {
    const data = await api.balances.getByGroup(groupId);
    return data;
  };

  const getFriendBalance = async (friendId) => {
    const data = await api.balances.getByFriend(friendId);
    return data;
  };

  const fetchActivities = useCallback(async (page = 1) => {
    try {
      const data = await api.activity.getAll({ page, limit: 30 });
      if (page === 1) {
        setActivities(data.activities || []);
      } else {
        setActivities(prev => [...prev, ...(data.activities || [])]);
      }
      return data;
    } catch (error) {
      console.error('Error fetching activities:', error.message);
      return { activities: [], pagination: {} };
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFriends(),
        fetchGroups(),
        fetchBalances(),
        fetchActivities(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchFriends, fetchGroups, fetchBalances, fetchActivities]);

  const getUserName = (userId) => {
    if (!userId) return 'Unknown';
    if (userId === user?._id) return 'You';
    const friend = friends.find(f => f._id === userId);
    if (friend) return friend.name || friend.email;
    return 'Unknown';
  };

  const getUserEmail = (userId) => {
    if (userId === user?._id) return user?.email;
    const friend = friends.find(f => f._id === userId);
    return friend?.email || 'Unknown';
  };

  return (
    <DataContext.Provider
      value={{
        friends,
        groups,
        balances,
        activities,
        loading,
        refreshing,
        refreshData,
        fetchFriends,
        addFriend,
        removeFriend,
        searchUsers,
        fetchGroups,
        createGroup,
        getGroupDetail,
        updateGroup,
        deleteGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        addExpense,
        updateExpense,
        deleteExpense,
        getExpenseDetail,
        addComment,
        deleteComment,
        settleUp,
        fetchBalances,
        getGroupBalances,
        getFriendBalance,
        fetchActivities,
        getUserName,
        getUserEmail,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
