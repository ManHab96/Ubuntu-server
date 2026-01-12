import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  // 1️⃣ Cargar conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(res.data)) {
          setConversations(res.data);
        } else {
          setError('Formato de conversaciones inválido');
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar conversaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // 2️⃣ Click en conversación → cargar mensajes
  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);

    try {
      const res = await axios.get(
        `${API_URL}/api/conversations/${conversation.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  //Eliminar mensajes
  const deleteConversation = async (conversationId) => {
    const confirmDelete = window.confirm(
      '¿Seguro que deseas eliminar esta conversación?'
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/api/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🧹 limpiar UI
      setConversations(prev =>
        prev.filter(c => c.id !== conversationId)
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la conversación');
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">

        {/* 🟦 LISTA DE CONVERSACIONES */}
        <Card className="col-span-1 overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversaciones
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {loading && <div>Cargando...</div>}

            {!loading && conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex justify-between items-start cursor-pointer rounded-lg p-3 border transition ${
                  selectedConversation?.id === conv.id
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div
                  className="flex-1"
                  onClick={() => openConversation(conv)}
                >
                  <div className="font-medium">
                     {conv.whatsapp_phone || 'Cliente'}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conv.last_message}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="text-red-500 text-sm hover:text-red-700 ml-2"
                  title="Eliminar conversación"
                >
                  🗑️
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 🟩 MENSAJES */}
        <Card className="col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>
              {selectedConversation
                ? selectedConversation.whatsapp_phone || 'Conversación'
                : 'Selecciona una conversación'}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {loadingMessages && (
              <div className="text-muted-foreground">
                Cargando mensajes...
              </div>
            )}

            {!loadingMessages && messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.from_customer
                    ? 'bg-muted mr-auto'
                    : 'bg-primary text-white ml-auto'
                }`}
              >
                <div className="text-sm">{msg.message_text}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Conversations;
