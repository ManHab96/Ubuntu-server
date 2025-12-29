import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, User, LogOut } from 'lucide-react';

const TopBar = () => {
  const navigate = useNavigate();
  const { agencies, activeAgency, selectAgency } = useAgency();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="h-16 bg-card border-b border-border fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-6 backdrop-blur-md">
      {/* Agency Selector */}
      <div className="flex items-center gap-4">
        <Building2 size={20} className="text-muted-foreground" />
        <Select
          value={activeAgency?.id}
          onValueChange={(value) => {
            const agency = agencies.find(a => a.id === value);
            if (agency) selectAgency(agency);
          }}
        >
          <SelectTrigger className="w-64" data-testid="topbar-agency-selector">
            <SelectValue placeholder="Seleccionar agencia" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id} data-testid={`agency-option-${agency.id}`}>
                {agency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-accent rounded-lg px-3 py-2 transition-colors" data-testid="user-menu-trigger">
          <div className="text-right">
            <p className="text-sm font-medium" data-testid="topbar-user-name">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Avatar data-testid="topbar-user-avatar">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleProfileClick} data-testid="profile-menu-item">
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item" className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TopBar;
