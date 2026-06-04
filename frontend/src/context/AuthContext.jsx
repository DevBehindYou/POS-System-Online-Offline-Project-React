// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check localStorage on initial load
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const response = await apiClient.login({ username, password });
      
      if (response.user) {
        setUser(response.user);
        setLoading(false);
        return { success: true, user: response.user };
      } else {
        setLoading(false);
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      setLoading(false);
      return { success: false, message: error.message || 'Login failed' };
    }
  }, []);

  const logout = useCallback(() => {
    apiClient.logout();
    setUser(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  }), [user, login, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};