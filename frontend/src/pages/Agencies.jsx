import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Agencies = () => {
  const { token } = useAuth();
  const { agencies, fetchAgencies, setActiveAgency, activeAgency } = useAgency();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    google_maps_url: '',
    business_hours: '',
    whatsapp_phone: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      google_maps_url: '',
      business_hours: '',
      whatsapp_phone: ''
    });
    setSelectedAgency(null);
  };

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
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear agencia');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`${API_URL}/api/agencies/${selectedAgency.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agencia actualizada exitosamente');
      setEditDialogOpen(false);
      fetchAgencies();
      resetForm();
      
      // Update active agency if it was edited
      if (activeAgency?.id === selectedAgency.id) {
        setActiveAgency({ ...activeAgency, ...formData });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al actualizar agencia');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (agency) => {
    setSelectedAgency(agency);
    setFormData({
      name: agency.name || '',
      address: agency.address || '',
      phone: agency.phone || '',
      google_maps_url: agency.google_maps_url || '',
      business_hours: agency.business_hours || '',
      whatsapp_phone: agency.whatsapp_phone || ''
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async (agencyId) => {
    try {
      await axios.delete(`${API_URL}/api/agencies/${agencyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agencia eliminada');
      fetchAgencies();
      
      // If deleted agency was active, clear selection
      if (activeAgency?.id === agencyId) {
        setActiveAgency(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al eliminar agencia');
    }
  };

  const AgencyForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
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
          placeholder="Lun-Vie 9:00-18:00, Sáb 10:00-14:00"
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
            placeholder="https://maps.google.com/..."
            value={formData.google_maps_url}
            onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
            data-testid="agency-maps-input"
          />
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} data-testid="agency-submit-btn">
          {loading ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="agencies-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold" data-testid="agencies-title">Agencias</h1>
            <p className="text-muted-foreground mt-2">Gestiona tus agencias automotrices</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
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
              <AgencyForm onSubmit={handleSubmit} submitLabel="Crear Agencia" />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Agencias ({agencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agencies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay agencias registradas. Crea una nueva agencia para comenzar.
              </div>
            ) : (
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
                    <TableRow 
                      key={agency.id} 
                      data-testid={`agency-row-${agency.id}`}
                      className={activeAgency?.id === agency.id ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {agency.name}
                          {activeAgency?.id === agency.id && (
                            <Badge variant="outline" className="text-xs">Activa</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{agency.address}</TableCell>
                      <TableCell>{agency.phone}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{agency.business_hours}</TableCell>
                      <TableCell>
                        <Badge variant={agency.is_active !== false ? 'default' : 'secondary'}>
                          {agency.is_active !== false ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(agency)}
                            data-testid={`edit-agency-${agency.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`delete-agency-${agency.id}`}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar agencia?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente la agencia "{agency.name}" y todos sus datos asociados. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(agency.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Agencia</DialogTitle>
            </DialogHeader>
            <AgencyForm onSubmit={handleEdit} submitLabel="Guardar Cambios" />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Agencies;
