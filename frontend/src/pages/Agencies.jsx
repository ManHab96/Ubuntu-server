import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Agencies = () => {
  const { token } = useAuth();
  const { agencies, fetchAgencies } = useAgency();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    google_maps_url: '',
    business_hours: '',
    whatsapp_phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/agencies/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agencia creada exitosamente');
      setDialogOpen(false);
      fetchAgencies();
      setFormData({
        name: '',
        address: '',
        phone: '',
        google_maps_url: '',
        business_hours: '',
        whatsapp_phone: ''
      });
    } catch (error) {
      toast.error('Error al crear agencia');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (agencyId) => {
    try {
      await axios.delete(`${API_URL}/api/agencies/${agencyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agencia desactivada');
      fetchAgencies();
    } catch (error) {
      toast.error('Error al desactivar agencia');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="agencies-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold" data-testid="agencies-title">Agencias</h1>
            <p className="text-muted-foreground mt-2">Gestiona tus agencias automotrices</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-agency-btn">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Agencia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Agencia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="agency-name-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      data-testid="agency-phone-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    data-testid="agency-address-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_hours">Horarios de Atención *</Label>
                  <Input
                    id="business_hours"
                    placeholder="Lun-Vie 9:00-18:00"
                    value={formData.business_hours}
                    onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                    required
                    data-testid="agency-hours-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_phone">WhatsApp</Label>
                    <Input
                      id="whatsapp_phone"
                      placeholder="521234567890"
                      value={formData.whatsapp_phone}
                      onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                      data-testid="agency-whatsapp-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="google_maps_url">Google Maps URL</Label>
                    <Input
                      id="google_maps_url"
                      value={formData.google_maps_url}
                      onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                      data-testid="agency-maps-input"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} data-testid="agency-submit-btn">
                    {loading ? 'Creando...' : 'Crear Agencia'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Agencias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Horarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency) => (
                  <TableRow key={agency.id} data-testid={`agency-row-${agency.id}`}>
                    <TableCell className="font-medium">{agency.name}</TableCell>
                    <TableCell>{agency.address}</TableCell>
                    <TableCell>{agency.phone}</TableCell>
                    <TableCell>{agency.business_hours}</TableCell>
                    <TableCell>
                      <Badge variant={agency.is_active ? 'default' : 'secondary'}>
                        {agency.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(agency.id)}
                        data-testid={`deactivate-agency-${agency.id}`}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Agencies;
