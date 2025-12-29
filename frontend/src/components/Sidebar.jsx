import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Car, FileText, Tag, Calendar, 
  Users, MessageSquare, Settings, Sparkles, LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', testId: 'sidebar-dashboard' },
    { icon: Building2, label: 'Agencias', path: '/agencies', testId: 'sidebar-agencies' },
    { icon: Car, label: 'Autos', path: '/cars', testId: 'sidebar-cars' },
    { icon: FileText, label: 'Archivos', path: '/files', testId: 'sidebar-files' },
    { icon: Tag, label: 'Promociones', path: '/promotions', testId: 'sidebar-promotions' },
    { icon: Calendar, label: 'Citas', path: '/appointments', testId: 'sidebar-appointments' },
    { icon: Users, label: 'Clientes', path: '/customers', testId: 'sidebar-customers' },
    { icon: MessageSquare, label: 'Conversaciones', path: '/conversations', testId: 'sidebar-conversations' },
    { icon: Settings, label: 'Configuración', path: '/config', testId: 'sidebar-config' },
    { icon: Sparkles, label: 'Prompt IA', path: '/ai-prompt', testId: 'sidebar-ai-prompt' },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold" data-testid="sidebar-logo">Agencia Auto</h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              className={
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          data-testid="sidebar-logout-btn"
        >
          <LogOut size={20} className="mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
