import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ExternalLink, HelpCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Config = () => {
  const { config, updateConfig } = useTheme();
  const { activeAgency } = useAgency();
  const [loading, setLoading] = useState(false);
  
  const [whatsappData, setWhatsappData] = useState({
    whatsapp_phone_number_id: '',
    whatsapp_access_token: '',
    whatsapp_business_account_id: '',
    whatsapp_verify_token: ''
  });
  
  const [brandingData, setBrandingData] = useState({
    brand_name: '',
    brand_description: '',
    primary_color: '',
    secondary_color: ''
  });
  
  const [aiData, setAiData] = useState({
    gemini_api_key: ''
  });

  useEffect(() => {
    if (config) {
      setWhatsappData({
        whatsapp_phone_number_id: config.whatsapp_phone_number_id || '',
        whatsapp_access_token: config.whatsapp_access_token || '',
        whatsapp_business_account_id: config.whatsapp_business_account_id || '',
        whatsapp_verify_token: config.whatsapp_verify_token || ''
      });
      
      setBrandingData({
        brand_name: config.brand_name || '',
        brand_description: config.brand_description || '',
        primary_color: config.primary_color || '',
        secondary_color: config.secondary_color || ''
      });
      
      setAiData({
        gemini_api_key: config.gemini_api_key || ''
      });
    }
  }, [config]);

  const handleWhatsAppSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConfig(whatsappData);
      toast.success('Configuración de WhatsApp actualizada');
    } catch (error) {
      toast.error('Error al actualizar configuración de WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConfig(brandingData);
      toast.success('Branding actualizado');
    } catch (error) {
      toast.error('Error al actualizar branding');
    } finally {
      setLoading(false);
    }
  };

  const handleAISubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConfig(aiData);
      toast.success('Configuración de IA actualizada');
    } catch (error) {
      toast.error('Error al actualizar configuración de IA');
    } finally {
      setLoading(false);
    }
  };

  const handleUseEmergentKey = async () => {
    setLoading(true);
    try {
      await updateConfig({ gemini_api_key: 'EMERGENT_LLM_KEY' });
      setAiData({ gemini_api_key: 'EMERGENT_LLM_KEY' });
      toast.success('Configurado para usar Emergent LLM Key');
    } catch (error) {
      toast.error('Error al configurar Emergent Key');
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
      <div className="space-y-6" data-testid="config-page">
        <div>
          <h1 className="text-4xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Configura tu agencia: {activeAgency.name}
          </p>
        </div>

        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList>
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">IA</TabsTrigger>
            <TabsTrigger value="branding" data-testid="tab-branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-4">
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>¿Necesitas ayuda para configurar WhatsApp Business Cloud API?</span>
                <Link to="/whatsapp-guide">
                  <Button size="sm" variant="outline">
                    Ver Guía Completa
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Credenciales de WhatsApp Business Cloud API</CardTitle>
                <CardDescription>
                  Conecta tu número de WhatsApp para que el asistente virtual pueda atender clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp_phone_number_id">
                        Phone Number ID
                        <Badge variant="outline" className="ml-2">Requerido</Badge>
                      </Label>
                    </div>
                    <Input
                      id="whatsapp_phone_number_id"
                      placeholder="123456789012345"
                      value={whatsappData.whatsapp_phone_number_id}
                      onChange={(e) => setWhatsappData({ ...whatsappData, whatsapp_phone_number_id: e.target.value })}
                      data-testid="whatsapp-phone-id-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lo encuentras en Meta for Developers → WhatsApp → Inicio rápido, debajo del número de teléfono
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp_access_token">
                        Access Token
                        <Badge variant="outline" className="ml-2">Requerido</Badge>
                      </Label>
                    </div>
                    <Input
                      id="whatsapp_access_token"
                      type="password"
                      placeholder="EAAxxxxxxxxxxxxxxxxxxxxx"
                      value={whatsappData.whatsapp_access_token}
                      onChange={(e) => setWhatsappData({ ...whatsappData, whatsapp_access_token: e.target.value })}
                      data-testid="whatsapp-token-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Temporal (24h): En Inicio rápido. Permanente: Configuración → Usuarios del sistema
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp_business_account_id">
                        Business Account ID
                        <Badge variant="outline" className="ml-2">Requerido</Badge>
                      </Label>
                    </div>
                    <Input
                      id="whatsapp_business_account_id"
                      placeholder="987654321098765"
                      value={whatsappData.whatsapp_business_account_id}
                      onChange={(e) => setWhatsappData({ ...whatsappData, whatsapp_business_account_id: e.target.value })}
                      data-testid="whatsapp-business-id-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lo encuentras en Configuración → WhatsApp Business Account
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp_verify_token">
                        Verify Token
                        <Badge variant="outline" className="ml-2">Requerido</Badge>
                      </Label>
                    </div>
                    <Input
                      id="whatsapp_verify_token"
                      placeholder="mi_token_secreto_123"
                      value={whatsappData.whatsapp_verify_token}
                      onChange={(e) => setWhatsappData({ ...whatsappData, whatsapp_verify_token: e.target.value })}
                      data-testid="whatsapp-verify-token-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tú lo creas al configurar el webhook. Usa cualquier texto seguro.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">📍 URL del Webhook:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white dark:bg-gray-900 p-2 rounded flex-1">
                        {window.location.origin}/api/whatsapp/webhook
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`);
                          toast.success('URL copiada al portapapeles');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Usa esta URL en Meta for Developers → WhatsApp → Configuración → Webhook
                    </p>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="submit" disabled={loading} data-testid="save-whatsapp-btn">
                      {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {whatsappData.whatsapp_phone_number_id && whatsappData.whatsapp_access_token && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  ✅ Credenciales de WhatsApp configuradas. Envía un mensaje de prueba para verificar.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de IA (Google Gemini 3 Flash)</CardTitle>
                <CardDescription>
                  Configura la API de Gemini para el asistente virtual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAISubmit} className="space-y-4">
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="space-y-2">
                      <p className="font-medium">Opción 1: Usar Emergent LLM Key (Recomendado)</p>
                      <p className="text-xs">
                        Clave universal que funciona con Gemini 3 Flash. Ya está disponible y lista para usar.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleUseEmergentKey}
                        disabled={loading}
                      >
                        Usar Emergent LLM Key
                      </Button>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gemini_api_key">
                      Gemini API Key
                      <Badge variant="outline" className="ml-2">Opcional</Badge>
                    </Label>
                    <Input
                      id="gemini_api_key"
                      type="password"
                      placeholder="AIzaSy..."
                      value={aiData.gemini_api_key}
                      onChange={(e) => setAiData({ ...aiData, gemini_api_key: e.target.value })}
                      data-testid="gemini-key-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Opción 2: Usa tu propia API Key de Google AI Studio. Déjalo en blanco para usar Emergent Key.
                    </p>
                  </div>
                  
                  {aiData.gemini_api_key && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        ✅ API Key configurada: {aiData.gemini_api_key === 'EMERGENT_LLM_KEY' ? 'Emergent LLM Key' : 'API Key personalizada'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="submit" disabled={loading} data-testid="save-ai-btn">
                      {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Marca</CardTitle>
                <CardDescription>
                  Personaliza los colores y textos de tu agencia
                </CardDescription>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Color Principal</Label>
                      <Input
                        id="primary_color"
                        placeholder="hsl(221.2 83.2% 53.3%)"
                        value={brandingData.primary_color}
                        onChange={(e) => setBrandingData({ ...brandingData, primary_color: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Color Secundario</Label>
                      <Input
                        id="secondary_color"
                        placeholder="hsl(210 40% 96.1%)"
                        value={brandingData.secondary_color}
                        onChange={(e) => setBrandingData({ ...brandingData, secondary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="submit" disabled={loading} data-testid="save-branding-btn">
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Config;
