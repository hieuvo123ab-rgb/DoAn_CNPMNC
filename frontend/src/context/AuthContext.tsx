import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, LoginPayload } from '../api/authApi';

export interface UserProfile {
  username: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved token and user on startup
    const savedToken = localStorage.getItem('edms_token');
    const savedUser = localStorage.getItem('edms_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('edms_token');
        localStorage.removeItem('edms_user');
      }
    }
    setIsLoading(false);

    // Listen to 401 unauthenticated event from apiClient
    const handleAuthLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  const login = async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
    const userProfile: UserProfile = {
      username: data.username,
      fullName: data.fullName,
      role: data.role,
    };

    localStorage.setItem('edms_token', data.token);
    localStorage.setItem('edms_user', JSON.stringify(userProfile));

    setToken(data.token);
    setUser(userProfile);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('edms_token');
      localStorage.removeItem('edms_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
