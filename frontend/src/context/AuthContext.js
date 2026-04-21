import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext({ user: null, login: () => {}, logout: () => {}, signup: () => {}, loading: true });

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const data = await api.auth.getMe();
        setUser(data.user);
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (email, password, name) => {
    const data = await api.auth.register({ name: name || email.split('@')[0], email, password });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const data = await api.auth.updateProfile(updates);
    setUser(data.user);
    return data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const data = await api.auth.changePassword({ currentPassword, newPassword });
    await AsyncStorage.setItem('token', data.token);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
