import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, FolderOpen, Image, Users, Mail,
  Settings, LogOut, Menu, X, Upload, Home, Cog, Layers, SlidersHorizontal,
  Search, ChevronDown, Tag, Globe, HardDrive, Info, FileText, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpeg';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Hero Slides', icon: SlidersHorizontal, path: '/admin/hero-slides' },
  { label: 'Home Sections', icon: Home, path: '/admin/home-sections' },
  { label: 'About Page', icon: Info, path: '/admin/about' },
  { label: 'Services', icon: Cog, path: '/admin/services' },
  { label: 'Process', icon: Layers, path: '/admin/process' },
  { label: 'Products', icon: Package, path: '/admin/products' },
  { label: 'Categories', icon: FolderOpen, path: '/admin/categories' },
  { label: 'Gallery', icon: Image, path: '/admin/gallery' },
  { label: 'Clients', icon: Users, path: '/admin/clients' },
  { label: 'Messages', icon: Mail, path: '/admin/messages' },
  { label: 'Quote Requests', icon: FileText, path: '/admin/quotes' },
  { label: 'Contact Info', icon: Phone, path: '/admin/contact' },
  { label: 'SEO', icon: Globe, path: '/admin/seo' },
  { label: 'Footer', icon: Layers, path: '/admin/footer' },
  { label: 'Site Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Backup', icon: HardDrive, path: '/admin/backup' },
  { label: 'Import Data', icon: Upload, path: '/admin/import' },
];

// All searchable entity types
type SearchScope = 'all' | 'products' | 'categories';

interface SearchResult {
  id: string;
  type: 'product' | 'category';
  title: string;
  subtitle?: string;
  path: string;
}

const AdminSearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [scopeOpen, setScopeOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  const scopeOptions: { id: SearchScope; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
      if (scopeRef.current && !scopeRef.current.contains(e.target as Node)) {
        setScopeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-search-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, is_active, categories(name_en)')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-search-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_en, name_bn, is_active')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const results: SearchResult[] = useCallback(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const out: SearchResult[] = [];

    if (scope === 'all' || scope === 'products') {
      products.forEach(p => {
        if (
          p.name_en.toLowerCase().includes(q) ||
          (p.name_bn || '').includes(q) ||
          ((p as any).categories?.name_en || '').toLowerCase().includes(q)
        ) {
          out.push({
            id: p.id,
            type: 'product',
            title: p.name_en,
            subtitle: `${(p as any).categories?.name_en ?? 'Uncategorized'} · ${p.is_active ? 'Active' : 'Inactive'}`,
            path: `/admin/products`,
          });
        }
      });
    }

    if (scope === 'all' || scope === 'categories') {
      categories.forEach(c => {
        if (
          c.name_en.toLowerCase().includes(q) ||
          (c.name_bn || '').includes(q)
        ) {
          out.push({
            id: c.id,
            type: 'category',
            title: c.name_en,
            subtitle: c.is_active ? 'Active' : 'Inactive',
            path: `/admin/categories`,
          });
        }
      });
    }

    return out.slice(0, 10);
  }, [query, scope, products, categories])();

  const showDropdown = focused && query.trim().length > 0;

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setQuery('');
    setFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const currentScopeLabel = scopeOptions.find(s => s.id === scope)?.label ?? 'All';

  return (
    <div className="flex items-stretch h-9 w-full max-w-xl relative" ref={wrapperRef}>
      {/* Scope selector */}
      <div className="relative flex-shrink-0" ref={scopeRef}>
        <button
          type="button"
          onClick={() => setScopeOpen(v => !v)}
          className="flex items-center gap-1 h-full px-3 bg-muted border border-border border-r-0 rounded-l-md text-xs font-medium text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
        >
          {currentScopeLabel}
          <ChevronDown className="h-3 w-3" />
        </button>
        {scopeOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 bg-background border border-border rounded-md shadow-xl z-[300] py-1">
            {scopeOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setScope(opt.id); setScopeOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted",
                  scope === opt.id ? "font-semibold text-primary" : "text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search products, categories..."
        className="flex-1 h-full px-3 text-sm bg-background border border-border border-r-0 outline-none placeholder:text-muted-foreground text-foreground focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-colors"
      />

      {/* Search button */}
      <button
        type="button"
        className="flex items-center justify-center px-3 h-full bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Live results dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-2xl z-[300] overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No results for "<span className="font-medium text-foreground">{query}</span>"
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-border bg-muted/40">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {results.map(r => (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors group"
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                        r.type === 'product' ? "bg-primary/10 text-primary" : "bg-accent/20 text-accent-foreground"
                      )}>
                        {r.type === 'product' ? <Package className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                        )}
                      </div>
                      <span className={cn(
                        "flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full",
                        r.type === 'product'
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/20 text-foreground"
                      )}>
                        {r.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

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
                    ? "bg-primary text-primary-foreground"
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
          <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-base flex-shrink-0 hidden sm:block" style={{ fontFamily: 'Inter, sans-serif' }}>
            {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
          </h1>
          {/* Amazon-style search */}
          <div className="flex-1 max-w-xl">
            <AdminSearchBar />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
