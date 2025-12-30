import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Phone, Calendar, MessageSquare, Edit, Trash, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Customers = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [customers, setCustomers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerMessages, setCustomerMessages] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'organic',
    notes: ''
  });

  useEffect(() => {
    if (activeAgency && token) {
      fetchCustomers();
    }
  }, [activeAgency, token]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/customers/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomers(response.data);
      
      // Fetch conversations and appointments for each customer
      const convPromises = response.data.map(c => 
        axios.get(`${API_URL}/api/conversations/?customer_id=${c.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      );
      
      const aptPromises = response.data.map(c =>
        axios.get(`${API_URL}/api/appointments/?customer_id=${c.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      );
      
      const convResults = await Promise.all(convPromises);
      const aptResults = await Promise.all(aptPromises);
      
      const convMap = {};
      const aptMap = {};
      
      response.data.forEach((c, i) => {
        convMap[c.id] = convResults[i].data;
        aptMap[c.id] = aptResults[i].data;
      });
      
      setConversations(convMap);
      setAppointments(aptMap);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/customers/`,
        { ...formData, agency_id: activeAgency.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cliente creado exitosamente');
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear cliente');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/api/customers/${selectedCustomer.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cliente actualizado');
      setEditDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error('Error al actualizar cliente');
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cliente eliminado');
      fetchCustomers();
    } catch (error) {
      toast.error('Error al eliminar cliente');
    }
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      source: customer.source || 'organic',
      notes: customer.notes || ''
    });
    setEditDialogOpen(true);
  };

  const openDetailDialog = async (customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
    
    // Fetch messages for this customer's conversations
    try {
      const convs = conversations[customer.id] || [];
      if (convs.length > 0) {
        const messagesRes = await axios.get(
          `${API_URL}/api/messages/?conversation_id=${convs[0].id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCustomerMessages(messagesRes.data);
      } else {
        setCustomerMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setCustomerMessages([]);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', source: 'organic', notes: '' });
    setSelectedCustomer(null);
  };

  const getSourceBadge = (source) => {
    const sources = {
      organic: { label: 'Orgánico', variant: 'default' },
      meta_ads: { label: 'Meta Ads', variant: 'secondary' },
      referral: { label: 'Referido', variant: 'outline' },
      whatsapp: { label: 'WhatsApp', variant: 'default' }
    };
    const config = sources[source] || sources.organic;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = filterSource === 'all' || customer.source === filterSource;
    
    return matchesSearch && matchesSource;
  });

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
      <div className="space-y-6" data-testid="customers-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">CRM de Clientes</h1>
            <p className="text-muted-foreground mt-2">Gestiona tus clientes y leads</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Fuente</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organic">Orgánico</SelectItem>
                      <SelectItem value="meta_ads">Meta Ads</SelectItem>
                      <SelectItem value="referral">Referido</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Cliente</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="organic">Orgánico</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="referral">Referido</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Clientes ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Cargando clientes...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron clientes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Conversaciones</TableHead>
                    <TableHead>Citas</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{getSourceBadge(customer.source)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conversations[customer.id]?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {appointments[customer.id]?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.created_at 
                          ? format(parseISO(customer.created_at), 'dd/MM/yyyy', { locale: es })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source">Fuente</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Orgánico</SelectItem>
                    <SelectItem value="meta_ads">Meta Ads</SelectItem>
                    <SelectItem value="referral">Referido</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notas</Label>
                <Input
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle del Cliente</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fuente</Label>
                    <p>{getSourceBadge(selectedCustomer.source)}</p>
                  </div>
                </div>

                {/* Appointments */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Citas ({appointments[selectedCustomer.id]?.length || 0})
                  </h3>
                  {appointments[selectedCustomer.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {appointments[selectedCustomer.id].map(apt => (
                        <div key={apt.id} className="p-3 bg-accent rounded-lg">
                          <div className="flex justify-between">
                            <span>{format(parseISO(apt.appointment_date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</span>
                            <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                              {apt.status}
                            </Badge>
                          </div>
                          {apt.notes && <p className="text-sm text-muted-foreground mt-1">{apt.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin citas registradas</p>
                  )}
                </div>

                {/* Recent Messages */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Últimos Mensajes
                  </h3>
                  {customerMessages.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customerMessages.slice(0, 10).map(msg => (
                        <div 
                          key={msg.id} 
                          className={`p-3 rounded-lg ${msg.from_customer ? 'bg-accent' : 'bg-primary/10'}`}
                        >
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{msg.from_customer ? 'Cliente' : 'Asistente IA'}</span>
                            {msg.timestamp && (
                              <span>{format(parseISO(msg.timestamp), 'dd/MM HH:mm')}</span>
                            )}
                          </div>
                          <p className="text-sm">{msg.message_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin mensajes</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
