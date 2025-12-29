import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const Appointments = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="appointments-page">
        <div>
          <h1 className="text-4xl font-bold">Sistema de Citas</h1>
          <p className="text-muted-foreground mt-2">Gestiona citas con clientes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Citas Programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              Funcionalidad en desarrollo
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
