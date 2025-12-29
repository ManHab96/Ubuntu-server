import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const Customers = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="customers-page">
        <div>
          <h1 className="text-4xl font-bold">CRM de Clientes</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus clientes y leads</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Clientes
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

export default Customers;
