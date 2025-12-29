import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AITestChat = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [testPhone, setTestPhone] = useState('+521234567890');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: '¡Hola! Soy el asistente virtual de la agencia. ¿En qué puedo ayudarte hoy?',
        from_customer: false,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeAgency) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      from_customer: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Simulate WhatsApp message processing
      const response = await axios.post(
        `${API_URL}/api/whatsapp/test-chat`,
        {
          message: inputMessage,
          phone: testPhone,
          agency_id: activeAgency.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        from_customer: false,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Error al procesar mensaje');
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        from_customer: false,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      text: '¡Hola! Soy el asistente virtual de la agencia. ¿En qué puedo ayudarte hoy?',
      from_customer: false,
      timestamp: new Date().toISOString()
    }]);
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
      <div className="space-y-6 max-w-4xl mx-auto" data-testid="ai-test-chat-page">
        <div>
          <h1 className="text-4xl font-bold">Chat de Prueba con IA</h1>
          <p className="text-muted-foreground mt-2">
            Prueba el asistente virtual sin necesidad de WhatsApp
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este chat simula la experiencia de WhatsApp. La IA tiene acceso a toda la información de la agencia: autos, promociones, horarios, etc.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <Badge variant="outline">
            Agencia: {activeAgency.name}
          </Badge>
          <Badge variant="outline">
            Teléfono de prueba: {testPhone}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={clearChat}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Chat
          </Button>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Asistente Virtual
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.from_customer ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.from_customer
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent'
                  }`}
                >
                  {message.from_customer ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div
                  className={`flex flex-col max-w-[70%] ${
                    message.from_customer ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.from_customer
                        ? 'bg-primary text-primary-foreground'
                        : message.error
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-accent'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-accent">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 bg-accent rounded-lg px-4 py-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>
          
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={loading}
                className="flex-1"
                data-testid="chat-input"
              />
              <Button type="submit" disabled={loading || !inputMessage.trim()} data-testid="send-message-btn">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Sugerencias de prueba:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>"Hola, quisiera información sobre autos disponibles"</li>
              <li>"¿Tienen promociones activas?"</li>
              <li>"Quiero agendar una cita"</li>
              <li>"¿Cuáles son sus horarios de atención?"</li>
              <li>"Me interesa un Toyota Camry"</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
};

export default AITestChat;
