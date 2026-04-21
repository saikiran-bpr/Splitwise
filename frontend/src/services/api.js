import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

const request = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request('/auth/me'),
    updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
    changePassword: (body) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
  },

  friends: {
    getAll: () => request('/friends'),
    add: (email) => request('/friends/add', { method: 'POST', body: JSON.stringify({ email }) }),
    remove: (friendId) => request(`/friends/${friendId}`, { method: 'DELETE' }),
    search: (q) => request(`/friends/search?q=${encodeURIComponent(q)}`),
  },

  groups: {
    getAll: () => request('/groups'),
    getById: (id) => request(`/groups/${id}`),
    create: (body) => request('/groups', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
    addMembers: (id, userIds) => request(`/groups/${id}/members`, { method: 'POST', body: JSON.stringify({ userIds }) }),
    removeMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  },

  expenses: {
    create: (body) => request('/expenses', { method: 'POST', body: JSON.stringify(body) }),
    getByGroup: (groupId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/expenses/group/${groupId}${query ? '?' + query : ''}`);
    },
    getUserExpenses: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/expenses/user${query ? '?' + query : ''}`);
    },
    getById: (id) => request(`/expenses/${id}`),
    update: (id, body) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
    addComment: (id, text) => request(`/expenses/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
    deleteComment: (expenseId, commentId) => request(`/expenses/${expenseId}/comments/${commentId}`, { method: 'DELETE' }),
  },

  settlements: {
    create: (body) => request('/settlements', { method: 'POST', body: JSON.stringify(body) }),
    getAll: () => request('/settlements'),
    getByGroup: (groupId) => request(`/settlements/group/${groupId}`),
    delete: (id) => request(`/settlements/${id}`, { method: 'DELETE' }),
  },

  balances: {
    getOverall: () => request('/balances/overall'),
    getByGroup: (groupId) => request(`/balances/group/${groupId}`),
    getByFriend: (friendId) => request(`/balances/friend/${friendId}`),
  },

  activity: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/activity${query ? '?' + query : ''}`);
    },
    getByGroup: (groupId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/activity/group/${groupId}${query ? '?' + query : ''}`);
    },
  },
};

export default api;
