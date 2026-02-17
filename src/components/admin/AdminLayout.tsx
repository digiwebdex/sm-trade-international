import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, FolderOpen, Image, Users, Mail,
  Settings, LogOut, Menu, X, Upload, Home, Cog, Layers, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpeg';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Hero Slides', icon: SlidersHorizontal, path: '/admin/hero-slides' },
  { label: 'Home Sections', icon: Home, path: '/admin/home-sections' },
  { label: 'Services', icon: Cog, path: '/admin/services' },
  { label: 'Process', icon: Layers, path: '/admin/process' },
  { label: 'Products', icon: Package, path: '/admin/products' },
  { label: 'Categories', icon: FolderOpen, path: '/admin/categories' },
  { label: 'Gallery', icon: Image, path: '/admin/gallery' },
  { label: 'Clients', icon: Users, path: '/admin/clients' },
  { label: 'Messages', icon: Mail, path: '/admin/messages' },
  { label: 'Site Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Import Data', icon: Upload, path: '/admin/import' },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate" style={{ fontFamily: 'Inter, sans-serif' }}>S. M. Trade</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sm-red text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-background border-b border-border flex items-center px-4 gap-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
