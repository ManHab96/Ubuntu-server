import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Appointments = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [formData, setFormData] = useState({
    customer_id: '',
    car_id: '',
    appointment_date: '',
    notes: ''
  });

  useEffect(() => {
    if (activeAgency) {
      fetchAppointments();
      fetchCustomers();
      fetchCars();
    }
  }, [activeAgency]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/appointments/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/customers/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCars = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/cars/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/api/appointments/`,
        {
          ...formData,
          agency_id: activeAgency.id,
          appointment_date: new Date(formData.appointment_date).toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Cita creada exitosamente');
      setDialogOpen(false);
      setFormData({
        customer_id: '',
        car_id: '',
        appointment_date: '',
        notes: ''
      });
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear cita');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/api/appointments/${appointmentId}/status?status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Estado actualizado');
      fetchAppointments();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pendiente' },
      confirmed: { variant: 'default', icon: CheckCircle, label: 'Confirmada' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelada' },
      completed: { variant: 'outline', icon: CheckCircle, label: 'Completada' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.appointment_date), date)
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get first day of month to calculate offset
    const firstDayOfWeek = monthStart.getDay();

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Week days header */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}

        {/* Calendar days */}
        {daysInMonth.map(date => {
          const dayAppointments = getAppointmentsForDate(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={`min-h-24 p-2 border rounded-lg transition-colors ${
                isCurrentDay ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                {format(date, 'd')}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map(apt => (
                  <div
                    key={apt.id}
                    className="text-xs p-1 bg-primary/20 rounded truncate cursor-pointer hover:bg-primary/30"
                    title={`${format(parseISO(apt.appointment_date), 'HH:mm')} - Cliente`}
                  >
                    {format(parseISO(apt.appointment_date), 'HH:mm')}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayAppointments.length - 2} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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
      <div className="space-y-6" data-testid="appointments-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Sistema de Citas</h1>
            <p className="text-muted-foreground mt-2">Gestiona citas con clientes</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-appointment-btn">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Nueva Cita</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Cliente *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="car_id">Auto (opcional)</Label>
                  <Select
                    value={formData.car_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, car_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin auto</SelectItem>
                      {cars.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          {car.brand} {car.model} {car.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment_date">Fecha y Hora *</Label>
                  <Input
                    id="appointment_date"
                    type="datetime-local"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas adicionales..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Agendando...' : 'Agendar Cita'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Hoy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                    >
                      Siguiente →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderCalendar()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Citas</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">Cargando citas...</div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay citas programadas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => {
                      const customer = customers.find(c => c.id === apt.customer_id);
                      const car = cars.find(c => c.id === apt.car_id);
                      
                      return (
                        <div
                          key={apt.id}
                          className="p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{customer?.name || 'Cliente no encontrado'}</p>
                                {getStatusBadge(apt.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {format(parseISO(apt.appointment_date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                              </p>
                              {car && (
                                <p className="text-sm text-muted-foreground">
                                  Auto: {car.brand} {car.model} {car.year}
                                </p>
                              )}
                              {apt.notes && (
                                <p className="text-sm text-muted-foreground italic">
                                  {apt.notes}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              {apt.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                  >
                                    Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {apt.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(apt.id, 'completed')}
                                >
                                  Completar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
