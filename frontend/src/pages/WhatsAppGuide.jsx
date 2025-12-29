import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const WhatsAppGuide = () => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl" data-testid="whatsapp-guide-page">
        <div>
          <h1 className="text-4xl font-bold">📱 Guía: Configurar WhatsApp Business</h1>
          <p className="text-muted-foreground mt-2">
            Sigue estos pasos para conectar tu agencia con WhatsApp Cloud API
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta guía te llevará aproximadamente <strong>15-20 minutos</strong>. Necesitarás tener una cuenta de Facebook Business.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="setup">Configuración</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="testing">Pruebas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>¿Qué necesitas?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Cuenta de Facebook Business</p>
                      <p className="text-sm text-muted-foreground">Gratuita, la crearás en el proceso</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Número de teléfono dedicado</p>
                      <p className="text-sm text-muted-foreground">No puede estar registrado en WhatsApp personal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Dominio HTTPS público</p>
                      <p className="text-sm text-muted-foreground">Para recibir mensajes (usa ngrok para pruebas)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credenciales que obtendrás</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-medium text-sm">Phone Number ID</p>
                    <code className="text-xs text-muted-foreground">Ejemplo: 123456789012345</code>
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-medium text-sm">Access Token</p>
                    <code className="text-xs text-muted-foreground">Ejemplo: EAAxxxxxxxxxxxxx...</code>
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-medium text-sm">Business Account ID</p>
                    <code className="text-xs text-muted-foreground">Ejemplo: 987654321098765</code>
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-medium text-sm">Verify Token</p>
                    <code className="text-xs text-muted-foreground">Tú lo creas (cualquier texto)</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paso 1: Meta Business Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>1.1</strong> Accede a Meta Business Suite:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">URL</Badge>
                    <a 
                      href="https://business.facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      https://business.facebook.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>1.2</strong> Crea tu cuenta:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Haz clic en "Crear cuenta"</li>
                    <li>Nombre del negocio: Agencia Automotriz [Tu Nombre]</li>
                    <li>Ingresa tu nombre y email empresarial</li>
                    <li>Verifica tu cuenta con el código enviado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paso 2: Crear App en Meta for Developers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>2.1</strong> Accede a Meta for Developers:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">URL</Badge>
                    <a 
                      href="https://developers.facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      https://developers.facebook.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>2.2</strong> Crear nueva app:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Clic en "Mis Apps" → "Crear App"</li>
                    <li>Tipo: <Badge>Empresa</Badge></li>
                    <li>Nombre: "Asistente Virtual Automotriz"</li>
                    <li>Email de contacto</li>
                    <li>Selecciona tu Business Account</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>2.3</strong> Agregar WhatsApp:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Busca "WhatsApp" en productos disponibles</li>
                    <li>Haz clic en "Configurar"</li>
                    <li>Confirma tu Business Account</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paso 3: Obtener Credenciales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>3.1</strong> En el panel de WhatsApp, ve a "Inicio rápido"</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-medium">📋 Copia estas credenciales:</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded">
                      <div>
                        <p className="text-xs font-medium">Phone Number ID</p>
                        <code className="text-xs text-muted-foreground">Debajo del número de teléfono</code>
                      </div>
                      <Badge>Requerido</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded">
                      <div>
                        <p className="text-xs font-medium">Temporary Access Token</p>
                        <code className="text-xs text-muted-foreground">Válido por 24h (para pruebas)</code>
                      </div>
                      <Badge>Requerido</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded">
                      <div>
                        <p className="text-xs font-medium">Business Account ID</p>
                        <code className="text-xs text-muted-foreground">En Configuración → WhatsApp Business Account</code>
                      </div>
                      <Badge>Requerido</Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Importante:</strong> El token temporal expira en 24 horas. Para producción, genera un token permanente en Paso 5.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>4.1</strong> ¿Qué es un Webhook?</p>
                  <p className="text-sm text-muted-foreground">
                    Es una URL pública donde Meta enviará los mensajes que recibe tu número de WhatsApp.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>4.2</strong> Obtén una URL HTTPS pública:</p>
                  
                  <div className="bg-accent p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Opción A: Usar ngrok (pruebas locales)</p>
                    <div className="bg-card p-3 rounded border">
                      <code className="text-xs">ngrok http 8001</code>
                    </div>
                    <p className="text-xs text-muted-foreground">Copia la URL HTTPS generada (ej: https://abc123.ngrok.io)</p>
                  </div>

                  <div className="bg-accent p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Opción B: Usar dominio Emergent (producción)</p>
                    <div className="bg-card p-3 rounded border flex items-center justify-between">
                      <code className="text-xs">https://tu-app.emergent.sh</code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(window.location.origin)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>4.3</strong> Configurar en Meta:</p>
                  <ul className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Ve a tu app → WhatsApp → Configuración</li>
                    <li>Sección "Webhook" → "Configurar webhook"</li>
                    <li>Completa:
                      <div className="ml-6 mt-2 space-y-2">
                        <div className="bg-card p-2 rounded border">
                          <p className="text-xs font-medium">URL de devolución de llamada:</p>
                          <code className="text-xs text-blue-600">https://tu-dominio.com/api/whatsapp/webhook</code>
                        </div>
                        <div className="bg-card p-2 rounded border">
                          <p className="text-xs font-medium">Token de verificación:</p>
                          <code className="text-xs text-blue-600">mi_token_secreto_123</code>
                          <p className="text-xs text-muted-foreground mt-1">Elige cualquier texto (guárdalo para el paso 6)</p>
                        </div>
                      </div>
                    </li>
                    <li>Clic en "Verificar y guardar"</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>4.4</strong> Suscribirse a eventos:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>En Configuración de Webhook → "Administrar"</li>
                    <li>Marca: <Badge variant="outline">messages</Badge> (obligatorio)</li>
                    <li>Opcional: <Badge variant="outline">message_status</Badge></li>
                    <li>Clic en "Guardar"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Probar la Integración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>7.1</strong> Configurar en tu Panel:</p>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Ve a <Badge variant="outline">Configuración → WhatsApp</Badge> en el menú</li>
                    <li>Ingresa las 4 credenciales obtenidas</li>
                    <li>Haz clic en "Guardar Configuración"</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>7.2</strong> Enviar mensaje de prueba:</p>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">📱 Desde tu WhatsApp personal:</p>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <p className="text-sm">Envía un mensaje al número configurado:</p>
                      <code className="text-xs text-muted-foreground block mt-1">
                        "Hola, quisiera información sobre autos disponibles"
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⏱️ Espera la respuesta del asistente virtual (2-5 segundos)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm"><strong>7.3</strong> Verificar en el Panel:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Ve a <Badge variant="outline">Conversaciones</Badge></li>
                    <li>Deberías ver tu número listado</li>
                    <li>Ve a <Badge variant="outline">Clientes</Badge></li>
                    <li>Tu número debería estar registrado automáticamente</li>
                    <li>Ve a <Badge variant="outline">Dashboard</Badge></li>
                    <li>"Leads Totales" debería incrementarse</li>
                  </ul>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>¡Éxito!</strong> Si recibiste una respuesta y ves los datos en el panel, tu asistente virtual está funcionando correctamente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Checklist Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                'Meta Business Account creada',
                'App en Meta for Developers configurada',
                'WhatsApp agregado al proyecto',
                'Credenciales obtenidas (Phone ID, Token, Business ID)',
                'Webhook configurado y verificado',
                'Eventos suscritos (messages)',
                'Credenciales ingresadas en tu panel',
                'Mensaje de prueba enviado y recibido',
                'Cliente registrado en CRM',
                'Respuesta de IA verificada'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded border-2 border-blue-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppGuide;
