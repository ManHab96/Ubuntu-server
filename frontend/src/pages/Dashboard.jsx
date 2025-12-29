import React, { useEffect, useState } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, TrendingUp, Car } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { activeAgency } = useAgency();
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeAgency && token) {
      fetchMetrics();
    }
  }, [activeAgency, token]);

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
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido a {activeAgency.name}
          </p>
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
            <Card data-testid="metric-appointments-today">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.appointments_today || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Citas programadas
                </p>
              </CardContent>
            </Card>

            <Card data-testid="metric-total-leads">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.total_leads || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clientes registrados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="metric-meta-ads-leads">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads Meta Ads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.meta_ads_leads || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  De anuncios pagados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="metric-top-cars">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Autos Consultados</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics?.top_consulted_cars?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  En inventario
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Consulted Cars */}
        {metrics?.top_consulted_cars && metrics.top_consulted_cars.length > 0 && (
          <Card data-testid="top-consulted-cars-section">
            <CardHeader>
              <CardTitle>Autos Más Consultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.top_consulted_cars.map((car, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                    <div>
                      <p className="font-medium">{car.brand} {car.model}</p>
                      <p className="text-sm text-muted-foreground">{car.year}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {car.consultations} consultas
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
