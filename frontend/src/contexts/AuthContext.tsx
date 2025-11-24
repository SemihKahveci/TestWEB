import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username?: string;
  name?: string;
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

  // 401 hatalarını sessizce handle et (kullanıcı henüz giriş yapmamış olabilir)
  authAxios.interceptors.response.use(
    (response) => response,
    (error) => {
      // 401 hatası beklenen bir durum, sessizce handle et
      if (error?.response?.status === 401) {
        // 401 hatasını sessizce return et, console'a yazdırma
        return Promise.reject(error);
      }
      // Diğer hataları normal şekilde handle et
      return Promise.reject(error);
    }
  );

  // Cookie kullanıldığı için interceptor'a gerek yok, withCredentials: true yeterli
  useEffect(() => {
    const verifyToken = async () => {
      // Eğer daha önce hiç giriş yapılmamışsa (localStorage'da flag yoksa), verify isteği atma
      const hasLoggedIn = localStorage.getItem('hasLoggedIn');
      if (!hasLoggedIn) {
        setIsLoading(false);
        setUser(null);
        return;
      }

      try {
        // Cookie'den token otomatik gönderilecek (withCredentials: true)
        const res = await authAxios.get('/auth/verify');
        setUser(res.data.user);
      } catch (err: any) {
        // 401 hatası geldiyse, flag'i temizle (cookie silinmiş olabilir)
        if (err?.response?.status === 401) {
          localStorage.removeItem('hasLoggedIn');
        } else if (err?.response?.status !== 401) {
          // 401 dışındaki hataları logla
          console.warn("Token doğrulama hatası:", err);
        }
        setUser(null);
      }
  
      setIsLoading(false);
    };
  
    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
      const response = await authAxios.post('/auth/login', {
        email,
        password
      });

      const { admin } = response.data;
      // Token artık cookie'de, localStorage'a gerek yok
      // Ancak verify isteği atmak için flag set et
      localStorage.setItem('hasLoggedIn', 'true');
      setUser(admin);
      return true;
  };

  const logout = async () => {
    try {
      await authAxios.post('/auth/logout');
    } catch (err) {
      console.error("Logout error:", err);
    }
    
    // Cookie backend'de temizlenecek
    // Flag'i de temizle, böylece bir sonraki yüklemede verify isteği atılmasın
    localStorage.removeItem('hasLoggedIn');
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
