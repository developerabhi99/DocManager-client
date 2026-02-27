import React from 'react';

const AuthContext = React.createContext(null);

function readStoredToken() {
  return (
    window.localStorage.getItem('token') ||
    window.sessionStorage.getItem('token') ||
    ''
  );
}

function readStoredUser() {
  const raw =
    window.localStorage.getItem('user') ||
    window.sessionStorage.getItem('user') ||
    '';

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function clearAuthStorage() {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  window.sessionStorage.removeItem('token');
  window.sessionStorage.removeItem('user');
}

function getActiveStorage() {
  if (window.localStorage.getItem('token')) return window.localStorage;
  if (window.sessionStorage.getItem('token')) return window.sessionStorage;
  return window.sessionStorage;
}

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => readStoredToken());
  const [user, setUser] = React.useState(() => readStoredUser());

  React.useEffect(() => {
    const handleStorage = (e) => {
      if (e?.key === 'token' || e?.key === 'user') {
        setToken(readStoredToken());
        setUser(readStoredUser());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = React.useCallback(({ token, user, rememberMe }) => {
    clearAuthStorage();

    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem('token', token || '');
    storage.setItem('user', JSON.stringify(user || null));

    setToken(token || '');
    setUser(user || null);
  }, []);

  const logout = React.useCallback(() => {
    clearAuthStorage();
    setToken('');
    setUser(null);
  }, []);

  const updateUser = React.useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      const storage = getActiveStorage();
      storage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = React.useMemo(() => {
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
      updateUser,
    };
  }, [token, user, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
