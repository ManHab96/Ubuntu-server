import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';

const Promotions = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="promotions-page">
        <div>
          <h1 className="text-4xl font-bold">Promociones del Mes</h1>
          <p className="text-muted-foreground mt-2">Gestiona ofertas y promociones</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promociones Activas
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

export default Promotions;
