import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('eventify_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const mockUser = {
      id: 1,
      name: "John Doe",
      email: email,
      role: email === "admin@eventify.com" ? "admin" : "user",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
    };
    setUser(mockUser);
    localStorage.setItem('eventify_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const signup = (name, email, password) => {
    const mockUser = {
      id: Date.now(),
      name: name,
      email: email,
      role: "user",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
    };
    setUser(mockUser);
    localStorage.setItem('eventify_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eventify_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
