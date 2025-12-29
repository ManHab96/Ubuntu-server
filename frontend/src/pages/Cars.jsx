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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Car as CarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Cars = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    description: '',
    is_available: true
  });

  useEffect(() => {
    if (activeAgency) {
      fetchCars();
    }
  }, [activeAgency]);

  const fetchCars = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/cars/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const carData = {
        ...formData,
        agency_id: activeAgency.id,
        price: formData.price ? parseFloat(formData.price) : null,
        year: parseInt(formData.year)
      };

      if (editingCar) {
        await axios.put(
          `${API_URL}/api/cars/${editingCar.id}`,
          carData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Auto actualizado exitosamente');
      } else {
        await axios.post(
          `${API_URL}/api/cars/`,
          carData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Auto agregado exitosamente');
      }

      setDialogOpen(false);
      resetForm();
      fetchCars();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar auto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price || '',
      description: car.description || '',
      is_available: car.is_available
    });
    setDialogOpen(true);
  };

  const handleDelete = async (carId) => {
    if (!confirm('¿Estás seguro de eliminar este auto?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/cars/${carId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Auto eliminado');
      fetchCars();
    } catch (error) {
      toast.error('Error al eliminar auto');
    }
  };

  const toggleAvailability = async (carId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/api/cars/${carId}/availability?is_available=${!currentStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Disponibilidad actualizada');
      fetchCars();
    } catch (error) {
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      description: '',
      is_available: true
    });
    setEditingCar(null);
  };

  const handleDialogClose = (open) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
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
      <div className="space-y-6" data-testid="cars-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Inventario de Autos</h1>
            <p className="text-muted-foreground mt-2">Gestiona tu catálogo de vehículos</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button data-testid="add-car-btn">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Auto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCar ? 'Editar Auto' : 'Agregar Nuevo Auto'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca *</Label>
                    <Input
                      id="brand"
                      placeholder="Toyota, Honda, etc."
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                      data-testid="car-brand-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo *</Label>
                    <Input
                      id="model"
                      placeholder="Camry, Civic, etc."
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                      data-testid="car-model-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Año *</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      data-testid="car-year-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (opcional)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="450000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      data-testid="car-price-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Características del vehículo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    data-testid="car-description-input"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                  <Label htmlFor="is_available">Disponible para venta</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} data-testid="save-car-btn">
                    {loading ? 'Guardando...' : editingCar ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando autos...</div>
        ) : cars.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay autos en el inventario. Haz clic en "Agregar Auto" para comenzar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Card key={car.id} data-testid={`car-card-${car.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{car.brand} {car.model}</span>
                    <Badge variant={car.is_available ? 'default' : 'secondary'}>
                      {car.is_available ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Año: {car.year}</p>
                    {car.price && (
                      <p className="text-lg font-bold mt-2">
                        ${car.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {car.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{car.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(car)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAvailability(car.id, car.is_available)}
                    >
                      {car.is_available ? 'Marcar No Disponible' : 'Marcar Disponible'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(car.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cars;
