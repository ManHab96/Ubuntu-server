import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AIPrompt = () => {
  const { config, updateConfig } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config?.ai_system_prompt) {
      setPrompt(config.ai_system_prompt);
    }
  }, [config]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateConfig({ ai_system_prompt: prompt });
      toast.success('Prompt actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="ai-prompt-page">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            Editor de Prompt IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Personaliza el comportamiento del asistente virtual
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prompt del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Escribe el prompt del sistema aquí..."
              data-testid="ai-prompt-textarea"
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                data-testid="save-prompt-btn"
              >
                {loading ? 'Guardando...' : 'Guardar Prompt'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guía de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Define claramente el rol y objetivo del asistente</li>
              <li>Establece reglas de conversación y tono</li>
              <li>Especifica qué puede y no puede hacer el asistente</li>
              <li>Incluye instrucciones sobre cómo manejar información de autos y promociones</li>
              <li>Define el proceso de agendamiento de citas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIPrompt;
