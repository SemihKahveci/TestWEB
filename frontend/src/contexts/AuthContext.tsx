import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API base URL - dinamik olarak belirle
  const API_BASE_URL = (import.meta as any).env?.DEV 
    ? 'http://localhost:5000/api'  // Development
    : '/api';  // Production (aynı domain'de serve edilir)

  // Axios instance oluştur - withCredentials her zaman aktif
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Cookie kullanıldığı için interceptor'a gerek yok, withCredentials: true yeterli
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Cookie'den token otomatik gönderilecek (withCredentials: true)
        const res = await authAxios.get('/auth/verify');
        setUser(res.data.user);
      } catch (err) {
        console.warn("Token geçersiz, logout");
        setUser(null);
      }
  
      setIsLoading(false);
    };
  
    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAxios.post('/auth/login', {
        email,
        password
      });

      const { admin } = response.data;
      // Token artık cookie'de, localStorage'a gerek yok
      setUser(admin);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAxios.post('/auth/logout');
    } catch (err) {
      console.error("Logout error:", err);
    }
    
    // Cookie backend'de temizlenecek, localStorage'a gerek yok
    setUser(null);
  };
  

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
