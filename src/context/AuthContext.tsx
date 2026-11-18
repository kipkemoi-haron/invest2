import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from '../types/index.ts';
import { auth, authPersistenceReady } from '../lib/firebase.ts';
import { api, authStorage } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    password: string;
    referralCode?: string;
  }) => Promise<User>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  quickLoginAs: () => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const mode = authStorage.getMode();
    const hasTokenSession = (mode === 'server' || mode === 'local') && Boolean(authStorage.getToken());
    if (!auth.currentUser && !hasTokenSession) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      if (!auth.currentUser) {
        authStorage.clearToken();
        authStorage.clearMode();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    authPersistenceReady.finally(() => {
      if (!mounted) return;
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!mounted) return;

        if (!fbUser) {
          const mode = authStorage.getMode();
          if ((mode === 'server' || mode === 'local') && authStorage.getToken()) {
            try {
              const res = await api.getMe();
              const activeMode = authStorage.getMode();
              if (!mounted || (activeMode !== 'server' && activeMode !== 'local') || !authStorage.getToken()) {
                return;
              }
              if (res.user.status === 'SUSPENDED') {
                await api.logout();
                if (mounted) setUser(null);
              } else {
                setUser(res.user);
              }
            } catch (err) {
              console.error('Session restore error:', err);
              authStorage.clearToken();
              authStorage.clearMode();
              if (mounted) setUser(null);
            } finally {
              if (mounted) setIsLoading(false);
            }
            return;
          }

          authStorage.clearToken();
          authStorage.clearMode();
          setUser(null);
          setIsLoading(false);
          return;
        }

        try {
          const token = await fbUser.getIdToken();
          if (!mounted || auth.currentUser?.uid !== fbUser.uid) return;
          authStorage.setMode('firebase');
          authStorage.setToken(token);

          const res = await api.getMe();
          if (!mounted || auth.currentUser?.uid !== fbUser.uid) return;

          if (res.user.status === 'SUSPENDED') {
            await api.logout();
            if (mounted) setUser(null);
          } else {
            setUser(res.user);
          }
        } catch (err) {
          console.error('Auth state sync error:', err);
          if (mounted && !auth.currentUser) {
            setUser(null);
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    password: string;
    referralCode?: string;
  }): Promise<User> => {
    const res = await api.register(payload);
    setUser(res.user);
    return res.user;
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await api.forgotPassword(email);
    return res.message;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const quickLoginAs = async (): Promise<User> => {
    try {
      return await login('janeatoni3@gmail.com', 'Password123!');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Incorrect email or password')) {
        return await register({
          fullName: 'Jane Toni',
          email: 'janeatoni3@gmail.com',
          password: 'Password123!',
          country: 'United States',
        });
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        forgotPassword,
        logout,
        quickLoginAs,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
