import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AgencyProvider } from './contexts/AgencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agencies from './pages/Agencies';
import Cars from './pages/Cars';
import Files from './pages/Files';
import Promotions from './pages/Promotions';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Conversations from './pages/Conversations';
import Config from './pages/Config';
import AIPrompt from './pages/AIPrompt';
import WhatsAppGuide from './pages/WhatsAppGuide';

import './App.css';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/agencies"
                element={
                  <PrivateRoute>
                    <Agencies />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cars"
                element={
                  <PrivateRoute>
                    <Cars />
                  </PrivateRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <PrivateRoute>
                    <Files />
                  </PrivateRoute>
                }
              />
              <Route
                path="/promotions"
                element={
                  <PrivateRoute>
                    <Promotions />
                  </PrivateRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <PrivateRoute>
                    <Appointments />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <PrivateRoute>
                    <Customers />
                  </PrivateRoute>
                }
              />
              <Route
                path="/conversations"
                element={
                  <PrivateRoute>
                    <Conversations />
                  </PrivateRoute>
                }
              />
              <Route
                path="/config"
                element={
                  <PrivateRoute>
                    <Config />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ai-prompt"
                element={
                  <PrivateRoute>
                    <AIPrompt />
                  </PrivateRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </BrowserRouter>
        </ThemeProvider>
      </AgencyProvider>
    </AuthProvider>
  );
}

export default App;
