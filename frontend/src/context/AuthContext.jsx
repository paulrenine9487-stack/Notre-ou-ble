import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthContext } from './authContextDef';
import { applyThemeColors } from '../utils/themeUtils';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('resonova_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('resonova_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState(() => {
    return sessionStorage.getItem('resonova_selected_goal') || '';
  });

  // Keep selected goal persisted in sessionStorage
  const updateSelectedGoal = (goal) => {
    setSelectedGoal(goal);
    if (goal) {
      sessionStorage.setItem('resonova_selected_goal', goal);
    } else {
      sessionStorage.removeItem('resonova_selected_goal');
    }
  };

  // Load and apply branding theme directly from MySQL database on portal initialization
  useEffect(() => {
    // 1. Immediately hydrate from localStorage for zero flash of default colors
    try {
      const savedTheme = localStorage.getItem('resonova_theme');
      if (savedTheme) {
        applyThemeColors(JSON.parse(savedTheme));
      }
    } catch (e) {}

    // 2. Sync with authoritative MySQL database
    api.getPublicTheme()
      .then(res => {
        if (res && res.success && res.theme) {
          applyThemeColors(res.theme);
        }
      })
      .catch(err => {
        console.warn('Branding theme DB fetch notice:', err.message);
      });
  }, []);

  // Verify token on mount
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('resonova_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          try {
            localStorage.setItem('resonova_user', JSON.stringify(response.user));
          } catch (e) {}
          // If user already has a saved goal in DB, keep it
          if (response.user.selected_musical_goal) {
            updateSelectedGoal(response.user.selected_musical_goal);
          }
        } else {
          localStorage.removeItem('resonova_token');
          localStorage.removeItem('resonova_user');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        localStorage.removeItem('resonova_token');
        localStorage.removeItem('resonova_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    if (data.mfaRequired) {
      return data;
    }
    setUser(data.user);
    setToken(data.token);
    try {
      localStorage.setItem('resonova_user', JSON.stringify(data.user));
    } catch (e) {}
    if (data.user?.selected_musical_goal) {
      updateSelectedGoal(data.user.selected_musical_goal);
    }
    return data;
  };

  const verifyMfa = async (mfaPayload) => {
    const data = await api.verifyMfa(mfaPayload);
    if (data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      try {
        localStorage.setItem('resonova_user', JSON.stringify(data.user));
      } catch (e) {}
    }
    return data;
  };

  const register = async (userData) => {
    const payload = {
      ...userData,
      selected_musical_goal: selectedGoal || userData.selected_musical_goal
    };
    return await api.register(payload);
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('resonova_token');
    localStorage.removeItem('resonova_user');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem('resonova_user', JSON.stringify(res.user));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    selectedGoal,
    setSelectedGoal: updateSelectedGoal,
    login,
    verifyMfa,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
