import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password-request`, {
        email: resetEmail
      });
      
      setResetSent(true);
      
      // For demo purposes, show the token (remove in production)
      if (response.data.token) {
        setResetToken(response.data.token);
      }
      
      toast.success('Instrucciones de restablecimiento enviadas');
    } catch (error) {
      toast.error('Error al procesar solicitud');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetDialogClose = () => {
    setForgotPasswordOpen(false);
    setResetSent(false);
    setResetEmail('');
    setResetToken('');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1761138078661-541ba2bf7b12?crop=entropy&cs=srgb&fm=jpg&q=85)'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl" data-testid="login-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Agencia Automotriz</CardTitle>
          <CardDescription>Inicia sesión para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@agencia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password-input"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto"
                    data-testid="forgot-password-link"
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Restablecer Contraseña</DialogTitle>
                    <DialogDescription>
                      Ingresa tu email y te enviaremos instrucciones
                    </DialogDescription>
                  </DialogHeader>
                  
                  {!resetSent ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          data-testid="reset-email-input"
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetDialogClose}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={resetLoading}
                          data-testid="reset-email-submit-btn"
                        >
                          {resetLoading ? 'Enviando...' : 'Enviar'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          Se han enviado las instrucciones de restablecimiento a tu correo
                        </AlertDescription>
                      </Alert>
                      
                      {resetToken && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertDescription className="space-y-2">
                            <p className="font-medium text-sm">🔧 Modo Demo:</p>
                            <p className="text-xs">Usa este link para restablecer tu contraseña:</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                const url = `/reset-password?token=${resetToken}`;
                                navigate(url);
                                handleResetDialogClose();
                              }}
                            >
                              Ir a restablecer contraseña
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              En producción, este link llegaría por email
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Button
                        onClick={handleResetDialogClose}
                        className="w-full"
                      >
                        Cerrar
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Credenciales de Demo:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Email: <code className="bg-background px-2 py-1 rounded">admin@agencia.com</code></p>
              <p>Contraseña: <code className="bg-background px-2 py-1 rounded">admin123</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
