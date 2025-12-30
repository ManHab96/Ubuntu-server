import React, { useEffect, useState } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Users, TrendingUp, Car, MessageSquare, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Plantillas de colores para gráficos
const COLOR_THEMES = {
  default: {
    name: 'Azul Corporativo',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#93c5fd',
    background: '#dbeafe',
    text: '#1e40af'
  },
  emerald: {
    name: 'Verde Esmeralda',
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#6ee7b7',
    background: '#d1fae5',
    text: '#065f46'
  },
  purple: {
    name: 'Púrpura Elegante',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    accent: '#c4b5fd',
    background: '#ede9fe',
    text: '#5b21b6'
  },
  amber: {
    name: 'Ámbar Cálido',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    accent: '#fcd34d',
    background: '#fef3c7',
    text: '#92400e'
  },
  rose: {
    name: 'Rosa Moderno',
    primary: '#f43f5e',
    secondary: '#fb7185',
    accent: '#fda4af',
    background: '#ffe4e6',
    text: '#be123c'
  }
};

const Dashboard = () => {
  const { activeAgency } = useAgency();
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorTheme, setColorTheme] = useState('default');

  const theme = COLOR_THEMES[colorTheme];

  useEffect(() => {
    if (activeAgency && token) {
      fetchMetrics();
    }
  }, [activeAgency, token]);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('dashboardColorTheme');
    if (savedTheme && COLOR_THEMES[savedTheme]) {
      setColorTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setColorTheme(newTheme);
    localStorage.setItem('dashboardColorTheme', newTheme);
  };

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/dashboard/metrics/${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data, maxValue }) => {
    if (!data || data.length === 0) return null;
    const max = maxValue || Math.max(...data.map(d => d.value), 1);
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate max-w-[200px]">{item.label}</span>
              <span style={{ color: theme.text }}>{item.value}</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: theme.background }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: theme.primary
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Donut chart component
  const DonutChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;
    
    let cumulativePercent = 0;
    const colors = [theme.primary, theme.secondary, theme.accent, '#94a3b8', '#cbd5e1'];
    
    return (
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((item, index) => {
              const percent = (item.value / total) * 100;
              const dashArray = `${percent} ${100 - percent}`;
              const dashOffset = -cumulativePercent;
              cumulativePercent += percent;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="20"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{item.label}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!activeAgency) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay agencia seleccionada</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Header with Theme Selector */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Bienvenido a {activeAgency.name}
            </p>
          </div>
          
          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Tema de colores:</Label>
            <Select value={colorTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COLOR_THEMES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: value.primary }}
                      />
                      {value.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-24" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="metric-appointments-today" style={{ borderLeftColor: theme.primary, borderLeftWidth: '4px' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <Calendar className="h-4 w-4" style={{ color: theme.primary }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                  {metrics?.appointments_today || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Citas programadas
                </p>
              </CardContent>
            </Card>

            <Card data-testid="metric-total-leads" style={{ borderLeftColor: theme.secondary, borderLeftWidth: '4px' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
                <Users className="h-4 w-4" style={{ color: theme.secondary }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: theme.secondary }}>
                  {metrics?.total_leads || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clientes registrados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="metric-meta-ads-leads" style={{ borderLeftColor: theme.accent, borderLeftWidth: '4px' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads Meta Ads</CardTitle>
                <TrendingUp className="h-4 w-4" style={{ color: theme.accent }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: theme.text }}>
                  {metrics?.meta_ads_leads || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  De anuncios pagados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="metric-conversations" style={{ borderLeftColor: theme.primary, borderLeftWidth: '4px' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
                <MessageSquare className="h-4 w-4" style={{ color: theme.primary }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                  {metrics?.total_conversations || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Chats activos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Consulted Cars Bar Chart */}
          <Card data-testid="top-consulted-cars-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" style={{ color: theme.primary }} />
                Autos Más Consultados
              </CardTitle>
              <CardDescription>Consultas por modelo de auto</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.top_consulted_cars && metrics.top_consulted_cars.length > 0 ? (
                <SimpleBarChart 
                  data={metrics.top_consulted_cars.map(car => ({
                    label: `${car.brand} ${car.model} ${car.year}`,
                    value: car.consultations || 1
                  }))}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de consultas aún
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads by Source Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: theme.secondary }} />
                Leads por Fuente
              </CardTitle>
              <CardDescription>Origen de los clientes</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.leads_by_source && Object.keys(metrics.leads_by_source).length > 0 ? (
                <DonutChart 
                  data={Object.entries(metrics.leads_by_source).map(([source, count]) => ({
                    label: source === 'organic' ? 'Orgánico' : 
                           source === 'meta_ads' ? 'Meta Ads' : 
                           source === 'referral' ? 'Referido' : source,
                    value: count
                  }))}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de fuentes aún
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointments by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: theme.primary }} />
              Estado de Citas
            </CardTitle>
            <CardDescription>Distribución de citas por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.appointments_by_status ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'pending', label: 'Pendientes', color: '#f59e0b' },
                  { key: 'confirmed', label: 'Confirmadas', color: theme.primary },
                  { key: 'completed', label: 'Completadas', color: theme.secondary },
                  { key: 'cancelled', label: 'Canceladas', color: '#ef4444' }
                ].map(({ key, label, color }) => (
                  <div 
                    key={key} 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <div className="text-3xl font-bold" style={{ color }}>
                      {metrics.appointments_by_status[key] || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de citas aún
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
