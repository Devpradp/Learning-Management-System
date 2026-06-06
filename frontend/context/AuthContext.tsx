'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'instructor' | 'student';
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    setToken(storedToken);
    apiFetch('/api/auth/me/')
      .then((data: User) => {
        setUser(data);
      })
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
