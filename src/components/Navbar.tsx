import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrefetchHome } from '@/hooks/usePrefetchHome';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpeg';

const Navbar = () => {
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const prefetchHome = usePrefetchHome();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; label: string } | null>(null);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const catDropRef = useRef<HTMLDivElement>(null);

  const resolveHref = (href: string) => {
    if (href.startsWith('#') && !isHome) return '/' + href;
    return href;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropRef.current && !catDropRef.current.contains(e.target as Node)) {
        setCatDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_en, name_bn')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const allLabel = lang === 'en' ? 'All Categories' : 'সব ক্যাটাগরি';
  const categoryOptions = [
    { id: 'all', label: lang === 'en' ? 'All Categories' : 'সব ক্যাটাগরি' },
    ...dbCategories.map(c => ({
      id: c.id,
      label: lang === 'en' ? c.name_en : (c.name_bn || c.name_en),
    })),
  ];
  const displayCatLabel = selectedCategory ? selectedCategory.label : allLabel;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams();
    params.set('q', searchQuery.trim());
    if (selectedCategory && selectedCategory.id !== 'all') {
      params.set('category', selectedCategory.id);
    }
    navigate(`/catalog?${params.toString()}`);
    setSearchQuery('');
  };

  const links = [
    { key: 'nav.home', href: '#home' },
    { key: 'nav.about', href: '#about' },
    { key: 'nav.services', href: '#services' },
    { key: 'nav.products', href: '#products' },
    { key: 'nav.catalog', href: '/catalog', isRoute: true },
    { key: 'nav.gallery', href: '/gallery', isRoute: true },
    { key: 'nav.configurator', href: '/configurator', isRoute: true },
    { key: 'nav.3dpreview', href: '/3d-preview', isRoute: true },
    { key: 'nav.contact', href: '#contact' },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-lg shadow-lg border-b border-border/50'
          : 'bg-background border-b border-transparent'
      }`}
    >
      {/* Main navbar row */}
      <div className="container mx-auto px-4 flex items-center gap-3 h-16">
        {/* Logo */}
        <a href={resolveHref('#home')} className="flex items-center gap-2 group flex-shrink-0">
          <img src={logo} alt="S. M. Trade International" className="h-10 w-auto rounded" />
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-px h-7 bg-[hsl(var(--sm-gold))]/40" />
            <span className="font-bold text-base leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              S. M. Trade<br/>International
            </span>
          </div>
        </a>

        {/* Amazon-style search bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-2xl items-stretch h-10 rounded-md overflow-hidden border-2 border-[hsl(var(--sm-gold))] focus-within:border-[hsl(var(--sm-gold))] shadow-sm"
        >
          {/* Category selector */}
          <div className="relative flex-shrink-0" ref={catDropRef}>
            <button
              type="button"
              onClick={() => setCatDropOpen(v => !v)}
              className="flex items-center gap-1 h-full px-3 bg-muted text-foreground text-xs font-medium border-r border-border hover:bg-secondary transition-colors whitespace-nowrap"
            >
              <span className="max-w-[90px] truncate">{displayCatLabel === allLabel ? (lang === 'en' ? 'All' : 'সব') : displayCatLabel}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>

            {catDropOpen && (
              <div className="absolute top-full left-0 mt-0.5 w-52 bg-popover border border-border rounded-md shadow-xl z-[200] py-1 max-h-72 overflow-y-auto">
                {categoryOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(opt.id === 'all' ? null : opt);
                      setCatDropOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 transition-colors ${
                      (opt.id === 'all' && !selectedCategory) || selectedCategory?.id === opt.id
                        ? 'text-[hsl(var(--sm-gold))] font-semibold bg-accent/5'
                        : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'en' ? 'Search products...' : 'পণ্য খুঁজুন...'}
            className="flex-1 px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none"
          />

          {/* Search button */}
          <button
            type="submit"
            className="flex items-center justify-center px-4 bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold-dark))] transition-colors flex-shrink-0"
          >
            <Search className="h-4 w-4 text-white" />
          </button>
        </form>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 flex-shrink-0 ml-auto">
          {links.map(l =>
            (l as any).isRoute ? (
              <Link
                key={l.key}
                to={l.href}
                className="relative px-3 py-2 font-medium text-xs text-foreground/80 hover:text-foreground transition-colors duration-300 group whitespace-nowrap"
              >
                {t(l.key)}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[hsl(var(--sm-gold))] group-hover:w-3/4 transition-all duration-300 rounded-full" />
              </Link>
            ) : (
              <a
                key={l.key}
                href={resolveHref(l.href)}
                onMouseEnter={!isHome ? prefetchHome : undefined}
                className="relative px-3 py-2 font-medium text-xs text-foreground/80 hover:text-foreground transition-colors duration-300 group whitespace-nowrap"
              >
                {t(l.key)}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[hsl(var(--sm-gold))] group-hover:w-3/4 transition-all duration-300 rounded-full" />
              </a>
            )
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <form
          onSubmit={handleSearch}
          className="flex items-stretch h-9 rounded-md overflow-hidden border-2 border-[hsl(var(--sm-gold))]"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'en' ? 'Search products...' : 'পণ্য খুঁজুন...'}
            className="flex-1 px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center px-3 bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold-dark))] transition-colors"
          >
            <Search className="h-4 w-4 text-white" />
          </button>
        </form>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/50 px-4 pb-4">
          {links.map(l =>
            (l as any).isRoute ? (
              <Link
                key={l.key}
                to={l.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-medium hover:text-primary transition-colors border-b border-border/30 last:border-0"
              >
                {t(l.key)}
              </Link>
            ) : (
              <a
                key={l.key}
                href={resolveHref(l.href)}
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-medium hover:text-primary transition-colors border-b border-border/30 last:border-0"
              >
                {t(l.key)}
              </a>
            )
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
