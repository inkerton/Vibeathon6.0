'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from './api-client';
import socketClient from './socket-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'reception' | 'kitchen' | 'inventory' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          const userData = response.data.data;
          setUser(userData);
          
          // Connect socket with token
          socketClient.connect(token);
          socketClient.joinRoleRoom(userData.role);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);

      // Connect socket
      socketClient.connect(accessToken);
      socketClient.joinRoleRoom(userData.role);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      await apiClient.post('/auth/register', data);
      // User needs to verify OTP before being logged in
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);

      // Connect socket
      socketClient.connect(accessToken);
      socketClient.joinRoleRoom(userData.role);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    socketClient.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOTP,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
