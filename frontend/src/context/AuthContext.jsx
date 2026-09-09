import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, configAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [appConfig, setAppConfig] = useState({ demo_mode: true, supported_languages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lm_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('lm_user', JSON.stringify(res.data));
        } catch {
          localStorage.removeItem('lm_token');
          localStorage.removeItem('lm_user');
          setUser(null);
        }
      }
      try {
        const cfg = await configAPI.getPublic();
        setAppConfig(cfg.data);
      } catch {
        // fallback to defaults
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('lm_token', access_token);
    localStorage.setItem('lm_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role = 'participant', preferred_language = 'en') => {
    const res = await authAPI.register({ name, email, password, role, preferred_language });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('lm_token', access_token);
    localStorage.setItem('lm_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('lm_token');
    localStorage.removeItem('lm_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('lm_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isHost: user?.role === 'host' || user?.role === 'admin',
      appConfig,
      isDemoMode: appConfig.demo_mode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
