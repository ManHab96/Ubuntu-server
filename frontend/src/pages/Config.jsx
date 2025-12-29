import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Config = () => {
  const { config, updateConfig } = useTheme();
  const [brandingData, setBrandingData] = useState({
    brand_name: config?.brand_name || '',
    brand_description: config?.brand_description || '',
    primary_color: config?.primary_color || '',
    secondary_color: config?.secondary_color || ''
  });

  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateConfig(brandingData);
      toast.success('Branding actualizado');
    } catch (error) {
      toast.error('Error al actualizar branding');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="config-page">
        <div>
          <h1 className="text-4xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-2">Configura tu agencia y servicios</p>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList>
            <TabsTrigger value="branding" data-testid="tab-branding">Branding</TabsTrigger>
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">IA</TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBrandingSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand_name">Nombre de la Marca</Label>
                    <Input
                      id="brand_name"
                      value={brandingData.brand_name}
                      onChange={(e) => setBrandingData({ ...brandingData, brand_name: e.target.value })}
                      data-testid="brand-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_description">Descripción</Label>
                    <Input
                      id="brand_description"
                      value={brandingData.brand_description}
                      onChange={(e) => setBrandingData({ ...brandingData, brand_description: e.target.value })}
                      data-testid="brand-description-input"
                    />
                  </div>
                  <Button type="submit" data-testid="save-branding-btn">
                    Guardar Cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de WhatsApp Business</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Configuración de WhatsApp Cloud API
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Configuración de Gemini API
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Config;
