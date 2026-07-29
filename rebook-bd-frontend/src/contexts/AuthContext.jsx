import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem('rebook_token');
    const savedUser = localStorage.getItem('rebook_user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { /* corrupted, ignore */ }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('rebook_token', token);
    localStorage.setItem('rebook_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('rebook_token');
    localStorage.removeItem('rebook_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem('rebook_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
