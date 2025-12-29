import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const AgencyContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AgencyProvider = ({ children }) => {
  const { token } = useAuth();
  const [agencies, setAgencies] = useState([]);
  const [activeAgency, setActiveAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAgencies();
    }
  }, [token]);

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/agencies/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgencies(response.data);
      
      // Set first active agency as default
      const active = response.data.find(a => a.is_active);
      if (active) {
        const savedAgencyId = localStorage.getItem('activeAgencyId');
        const agencyToSet = response.data.find(a => a.id === savedAgencyId) || active;
        setActiveAgency(agencyToSet);
      }
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectAgency = (agency) => {
    setActiveAgency(agency);
    localStorage.setItem('activeAgencyId', agency.id);
  };

  return (
    <AgencyContext.Provider value={{ agencies, activeAgency, selectAgency, fetchAgencies, loading }}>
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within AgencyProvider');
  }
  return context;
};
