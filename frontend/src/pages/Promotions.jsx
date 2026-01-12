import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Promotions = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

    const fetchPromotions = async () => {
       if (!activeAgency) return;
       
       try {
          const res = await axios.get(
             `${API_URL}/api/promotions/?agency_id=${activeAgency.id}&category=promotion`,
             {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
             }
          );
          
          setPromotions(res.data);
         }catch (err) {
          console.error('Error fetching promotions', err);
        } finally {
          setLoading(false);
       }
    };  
  
  useEffect(() => {
   fetchPromotions();
  }, [activeAgency]);

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="promotions-page">
        <div>
          <h1 className="text-4xl font-bold">Promociones del Mes</h1>
          <p className="text-muted-foreground mt-2">Gestiona ofertas y promociones</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promociones Activas
            </CardTitle>
          </CardHeader>
          {/*Modificacion*/}
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando promociones...
              </div>
            ) : promotions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                 No hay promociones registradas
              </div>
            ) : (
              <div className="space-y-4">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="border rounded-lg p-4 flex justify-between items-start"
                  >
                    <div>
                       <p className="font-semibold">
                          {promo.filename}
                       </p>

                       <p className="text-sm text-muted-foreground">
                          {promo.start_date
                             ? `Desde ${new Date(promo.start_date).toLocaleDateString()}`
                             :'Sin fecha inicio'}
                          {' — '}
                          {promo.end_date
                              ? `Hasta ${new Date(promo.end_date).toLocaleDateString()}`
                              : 'Sin fecha fin'}
                       </p>
                    </div>
                    
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                          promo.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                      {promo.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Promotions;
