import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(
        `${API_URL}/api/auth/profile`,
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Perfil actualizado exitosamente');
      
      // If email changed, logout and ask to login again
      if (profileData.email !== user?.email) {
        toast.info('Email actualizado. Por favor inicia sesión nuevamente.');
        setTimeout(() => logout(), 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(
        `${API_URL}/api/auth/change-password`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Contraseña actualizada exitosamente');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl" data-testid="profile-page">
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Administra tu información personal</p>
        </div>

        {/* User Info Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-lg">{user?.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Rol: {user?.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Editar Información Personal</CardTitle>
            <CardDescription>Actualiza tu nombre y correo electrónico</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  data-testid="profile-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                  data-testid="profile-email-input"
                />
              </div>
              
              <Alert>
                <AlertDescription className="text-xs">
                  Si cambias tu correo electrónico, deberás iniciar sesión nuevamente.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} data-testid="save-profile-btn">
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>Actualiza tu contraseña para mayor seguridad</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña Actual</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  required
                  data-testid="current-password-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva Contraseña</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="new-password-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="confirm-password-input"
                />
              </div>
              
              <Alert>
                <AlertDescription className="text-xs">
                  La contraseña debe tener al menos 6 caracteres.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} data-testid="change-password-btn">
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
