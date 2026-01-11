import React, { createContext, useState, useContext, useEffect } from "react";
import axios from 'axios';
import { useAuth } from "./AuthContext";
import { useAgency } from "./AgencyContext";

const ThemeContext = createContext(null);
const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ThemeProvider = ({ children }) => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (token && activeAgency?.id) {
      fetchConfig(activeAgency.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeAgency?.id]);

  const fetchConfig = async (agencyId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/config/${agencyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setConfig(response.data);
      applyTheme(response.data);
    } catch (error) {
      console.error(
        "Error fetching config:",
        error.response?.data || error
      );
    }
  };

  const applyTheme = (themeConfig) => {
    const root = document.documentElement;

    if (themeConfig?.primary_color) {
      root.style.setProperty("--primary", themeConfig.primary_color);
    }
    if (themeConfig?.secondary_color) {
      root.style.setProperty("--secondary", themeConfig.secondary_color);
    }
    if (themeConfig?.button_color) {
      root.style.setProperty("--button", themeConfig.button_color);
    }
    if (themeConfig?.text_color) {
      root.style.setProperty("--foreground", themeConfig.text_color);
    }
  };

  /**
   * updates ejemplo:
   * { ai_system_prompt: "texto..." }
   */

const updateConfig = async (updates) => {
  if (!activeAgency?.id) {
    console.error("No hay agencia activa");
    throw new Error("No hay agencia activa");
  }

const agencyId = activeAgency.id;
   
  try {
    console.log("PUT CONFIG →", activeAgency.id, updates);

    const response = await axios.put(
      `${API_URL}/api/config/${activeAgency.id}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setConfig(response.data);
    applyTheme(response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating config:",
      error.response?.data || error
    );
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
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
