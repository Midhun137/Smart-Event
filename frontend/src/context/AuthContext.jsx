import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    const loggedUser = res.data.user;
    localStorage.setItem('token', res.data.token || 'logged_in_token');
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.register(data);
    const newUser = res.data.user;
    localStorage.setItem('token', res.data.token || 'registered_token');
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
