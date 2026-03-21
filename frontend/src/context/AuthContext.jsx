import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on load
  useEffect(() => {
    const storedUser = localStorage.getItem('session_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('session_user', JSON.stringify(userData));
    
    // Compatibility for existing components that use currentStudent/currentVolunteer directly
    if (userData.role === 'Student') {
      localStorage.setItem('currentStudent', JSON.stringify({ _id: userData.id, ...userData }));
    } else if (userData.role === 'Volunteer') {
      localStorage.setItem('currentVolunteer', JSON.stringify({ _id: userData.id, ...userData }));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('currentVolunteer');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
