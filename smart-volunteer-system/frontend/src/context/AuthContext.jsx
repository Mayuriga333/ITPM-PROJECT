/**
 * context/AuthContext.jsx — Global authentication state (includes status)
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      
      // Block non-approved users from storing tokens (unless Admin)
      if (data.user.role !== 'Admin' && data.user.status !== 'Approved') {
        const errorMsg = data.user.status === 'Pending' 
          ? '⏳ Your account is pending admin approval. Please check back later.'
          : data.user.status === 'Suspended'
          ? '⛔ Your account has been suspended. Please contact support.'
          : '❌ Your account application was rejected. Please contact support.';
        
        throw { response: { data: { message: errorMsg } } };
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, role: data.user.role };
    } catch (err) {
      const code    = err.response?.data?.code;
      const message = err.response?.data?.message || 'Login failed.';
      return { success: false, message, code };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, role: data.user.role, status: data.user.status, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};