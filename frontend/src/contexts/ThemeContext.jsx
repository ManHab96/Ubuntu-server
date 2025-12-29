import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useAgency } from './AgencyContext';

const ThemeContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ThemeProvider = ({ children }) => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (token && activeAgency) {
      fetchConfig();
    }
  }, [token, activeAgency]);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/config/${activeAgency.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
      applyTheme(response.data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const applyTheme = (themeConfig) => {
    const root = document.documentElement;
    
    if (themeConfig.primary_color) {
      root.style.setProperty('--primary', themeConfig.primary_color);
    }
    if (themeConfig.secondary_color) {
      root.style.setProperty('--secondary', themeConfig.secondary_color);
    }
    if (themeConfig.button_color) {
      root.style.setProperty('--button', themeConfig.button_color);
    }
    if (themeConfig.text_color) {
      root.style.setProperty('--foreground', themeConfig.text_color);
    }
  };

  const updateConfig = async (updates) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/config/${activeAgency.id}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfig(response.data);
      applyTheme(response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ config, updateConfig, fetchConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
