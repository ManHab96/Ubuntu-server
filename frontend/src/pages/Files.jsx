import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Files = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="files-page">
        <div>
          <h1 className="text-4xl font-bold">Media Center</h1>
          <p className="text-muted-foreground mt-2">Gestiona archivos y documentos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Archivos y Documentos
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

export default Files;
