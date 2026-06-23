import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, registerUser, getMe } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await SecureStore.getItemAsync('weder_token');
        if (token) { const res = await getMe(); setUser(res.data); }
      } catch {}
      finally { setLoading(false); }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    await SecureStore.setItemAsync('weder_token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password, phone, role, vendorProfile) => {
    const res = await registerUser({ name, email, password, phone, role, vendorProfile });
    await SecureStore.setItemAsync('weder_token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('weder_token');
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
