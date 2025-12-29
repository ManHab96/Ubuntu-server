import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car as CarIcon } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Cars = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeAgency) {
      fetchCars();
    }
  }, [activeAgency]);

  const fetchCars = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cars/?agency_id=${activeAgency.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="cars-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Inventario de Autos</h1>
            <p className="text-muted-foreground mt-2">Gestiona tu catálogo de vehículos</p>
          </div>
          <Button>
            <CarIcon className="mr-2 h-4 w-4" />
            Agregar Auto
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando...</div>
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
                <CardContent>
                  <p className="text-sm text-muted-foreground">Año: {car.year}</p>
                  {car.price && <p className="text-lg font-bold mt-2">${car.price.toLocaleString()}</p>}
                  {car.description && <p className="text-sm mt-2">{car.description}</p>}
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
