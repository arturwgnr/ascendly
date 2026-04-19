import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try { await axios.post('/api/auth/logout', {}, { withCredentials: true }); } catch {}
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((r) => {
        setAccessToken(r.data.accessToken);
        setUser(r.data.user || { id: null });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  function loginSuccess(token, userData) {
    setAccessToken(token);
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
