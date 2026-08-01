'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from './api-client';
import socketClient from './socket-client';

export type Role = 'customer' | 'reception' | 'kitchen' | 'inventory' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<User>;
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
    console.log('[AUTH_CONTEXT] login() called');
    console.log('[AUTH_CONTEXT] Email:', email);
    
    try {
      console.log('[AUTH_CONTEXT] Sending POST to /auth/login');
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('[AUTH_CONTEXT] Login API response:', response.data);
      
      const { user: userData, accessToken, refreshToken } = response.data.data;
      console.log('[AUTH_CONTEXT] User data from response:', userData);
      console.log('[AUTH_CONTEXT] Access token received:', !!accessToken);
      console.log('[AUTH_CONTEXT] Refresh token received:', !!refreshToken);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      console.log('[AUTH_CONTEXT] User state updated');

      // Connect socket
      console.log('[AUTH_CONTEXT] Connecting socket...');
      socketClient.connect(accessToken);
      socketClient.joinRoleRoom(userData.role);
      console.log('[AUTH_CONTEXT] Socket connected and joined role room:', userData.role);
      
      return userData;
    } catch (error: any) {
      console.error('[AUTH_CONTEXT] Login API error:', error);
      console.error('[AUTH_CONTEXT] Error response:', error.response?.data);
      console.error('[AUTH_CONTEXT] Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    console.log('[AUTH_CONTEXT] register() called');
    console.log('[AUTH_CONTEXT] Registration data:', { 
      name: data.name, 
      email: data.email, 
      phone: data.phone,
      hasPassword: !!data.password 
    });
    
    try {
      console.log('[AUTH_CONTEXT] Sending POST to /auth/register');
      const response = await apiClient.post('/auth/register', data);
      console.log('[AUTH_CONTEXT] Registration API response:', response.data);
      
      // Return the response data (may include OTP in development mode)
      return response.data.data;
    } catch (error: any) {
      console.error('[AUTH_CONTEXT] Registration API error:', error);
      console.error('[AUTH_CONTEXT] Error response:', error.response?.data);
      console.error('[AUTH_CONTEXT] Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    console.log('[AUTH_CONTEXT] verifyOTP() called');
    console.log('[AUTH_CONTEXT] Email:', email);
    console.log('[AUTH_CONTEXT] OTP:', otp);
    
    try {
      console.log('[AUTH_CONTEXT] Sending POST to /auth/verify-otp');
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      console.log('[AUTH_CONTEXT] OTP verification API response:', response.data);
      
      const { user: userData, accessToken, refreshToken } = response.data.data;
      console.log('[AUTH_CONTEXT] User data from response:', userData);
      console.log('[AUTH_CONTEXT] Access token received:', !!accessToken);
      console.log('[AUTH_CONTEXT] Refresh token received:', !!refreshToken);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      console.log('[AUTH_CONTEXT] User state updated');

      // Connect socket
      console.log('[AUTH_CONTEXT] Connecting socket...');
      socketClient.connect(accessToken);
      socketClient.joinRoleRoom(userData.role);
      console.log('[AUTH_CONTEXT] Socket connected and joined role room:', userData.role);
      
      return userData;
    } catch (error: any) {
      console.error('[AUTH_CONTEXT] OTP verification API error:', error);
      console.error('[AUTH_CONTEXT] Error response:', error.response?.data);
      console.error('[AUTH_CONTEXT] Error status:', error.response?.status);
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
