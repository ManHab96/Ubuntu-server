import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Conversations = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="conversations-page">
        <div>
          <h1 className="text-4xl font-bold">Conversaciones</h1>
          <p className="text-muted-foreground mt-2">Historial de conversaciones de WhatsApp</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversaciones Recientes
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

export default Conversations;
