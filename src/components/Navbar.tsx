import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, ChevronDown, Tag } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrefetchHome } from '@/hooks/usePrefetchHome';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import logo from '@/assets/logo-sm.webp';

const Navbar = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const prefetchHome = usePrefetchHome();
  const companyName = get('branding', 'company_name', 'S. M. Trade International');

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchCatOpen, setSearchCatOpen] = useState(false);
  const [navCatOpen, setNavCatOpen] = useState(false);

  const searchCatRef = useRef<HTMLDivElement>(null);
  const navCatRef = useRef<HTMLDivElement>(null);

  const resolveHref = (href: string) => {
    if (href.startsWith('#') && !isHome) return '/' + href;
    return href;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchCatRef.current && !searchCatRef.current.contains(e.target as Node)) {
        setSearchCatOpen(false);
      }
      if (navCatRef.current && !navCatRef.current.contains(e.target as Node)) {
        setNavCatOpen(false);
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
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const allLabel = lang === 'en' ? 'All' : 'সব';
  const categoryOptions = [
    { id: 'all', label: allLabel },
    ...dbCategories.map(c => ({
      id: c.id,
      label: lang === 'en' ? c.name_en : (c.name_bn || c.name_en),
    })),
  ];

  const selectedCategoryLabel = selectedCategoryId
    ? categoryOptions.find(o => o.id === selectedCategoryId)?.label ?? allLabel
    : allLabel;

  const displaySearchCatLabel = selectedCategoryLabel.length > 8
    ? selectedCategoryLabel.slice(0, 8) + '…'
    : selectedCategoryLabel;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams();
    params.set('q', searchQuery.trim());
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      params.set('category', selectedCategoryId);
    }
    navigate(`/catalog?${params.toString()}`);
    setSearchQuery('');
  };

  const handleNavCategoryClick = (id: string) => {
    setNavCatOpen(false);
    if (id === 'all') {
      navigate('/catalog');
    } else {
      navigate(`/catalog?category=${id}`);
    }
  };

  // Fetch dynamic menu from site_settings
  const { data: menuSetting } = useQuery({
    queryKey: ['site-settings', 'nav_menu'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'nav_menu')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  const defaultLinks = [
    { key: 'nav.home', href: '#home', type: 'hash' as const, label_en: 'Home', label_bn: 'হোম', is_active: true },
    { key: 'nav.about', href: '/about', type: 'route' as const, label_en: 'About', label_bn: 'আমাদের সম্পর্কে', is_active: true },
    { key: 'nav.services', href: '#services', type: 'hash' as const, label_en: 'Services', label_bn: 'সেবা', is_active: true },
    { key: 'nav.products', href: '#products', type: 'hash' as const, label_en: 'Products', label_bn: 'পণ্য', is_active: true },
    { key: 'nav.gallery', href: '/gallery', type: 'route' as const, label_en: 'Gallery', label_bn: 'গ্যালারি', is_active: true },
    { key: 'nav.configurator', href: '/configurator', type: 'route' as const, label_en: 'Configure', label_bn: 'কনফিগার', is_active: true },
    { key: 'nav.contact', href: '#contact', type: 'hash' as const, label_en: 'Contact', label_bn: 'যোগাযোগ', is_active: true },
  ];

  const menuItems = (() => {
    const saved = (menuSetting?.setting_value as any)?.items;
    if (Array.isArray(saved) && saved.length > 0) {
      return saved
        .filter((i: any) => i.is_active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((i: any) => ({
          key: `nav.${i.id}`,
          href: i.href,
          type: i.type as 'hash' | 'route' | 'external',
          label_en: i.label_en,
          label_bn: i.label_bn || i.label_en,
          is_active: i.is_active,
        }));
    }
    return defaultLinks;
  })();

  const allLinks = menuItems;

  const categoriesLabel = lang === 'en' ? 'Categories' : 'ক্যাটাগরি';

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-lg shadow-lg border-b border-border/50'
          : 'bg-background border-b border-border/30'
      }`}
    >
      {/* ── Single Row: Logo + Search + Nav Links ── */}
      <div className="container mx-auto px-4 flex items-center gap-4 h-14">

        {/* Logo + Brand name */}
        <a href={resolveHref('#home')} className="flex items-center gap-2.5 group flex-shrink-0">
          <img src={logo} alt={companyName} className="h-9 w-9 rounded object-cover" />
          <span className="hidden sm:block font-bold text-base leading-tight whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {companyName}
          </span>
        </a>

        {/* Search bar — desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-lg items-stretch h-9 rounded-md border-2 border-[hsl(var(--sm-gold))] shadow-sm overflow-visible"
        >
          {/* Category selector */}
          <div className="relative flex-shrink-0" ref={searchCatRef}>
            <button
              type="button"
              onClick={() => setSearchCatOpen(v => !v)}
              className="flex items-center gap-1 h-full px-2.5 bg-muted text-foreground text-xs font-medium border-r border-border hover:bg-secondary transition-colors whitespace-nowrap rounded-l-[4px]"
            >
              <span className="max-w-[56px] truncate">{displaySearchCatLabel}</span>
              <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${searchCatOpen ? 'rotate-180' : ''}`} />
            </button>
            {searchCatOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-md shadow-2xl z-[400] py-1 max-h-72 overflow-y-auto">
                {categoryOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(opt.id === 'all' ? null : opt.id);
                      setSearchCatOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 transition-colors ${
                      (opt.id === 'all' && !selectedCategoryId) || selectedCategoryId === opt.id
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
            className="flex-1 px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />

          {/* Search button */}
          <button
            type="submit"
            className="flex items-center justify-center px-3.5 bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold-dark))] transition-colors flex-shrink-0 rounded-r-[4px]"
          >
            <Search className="h-4 w-4 text-white" />
          </button>
        </form>

        {/* Desktop nav links — right aligned */}
        <div className="hidden md:flex items-center gap-0 flex-shrink-0">
          {allLinks.map(l =>
            l.type === 'route' ? (
              <Link
                key={l.key}
                to={l.href}
                className="relative px-3 py-2 font-medium text-[13px] text-foreground/75 hover:text-foreground transition-colors duration-200 group whitespace-nowrap"
              >
                {lang === 'en' ? l.label_en : l.label_bn}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[hsl(var(--sm-gold))] group-hover:w-3/4 transition-all duration-300 rounded-full" />
              </Link>
            ) : l.type === 'external' ? (
              <a
                key={l.key}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative px-3 py-2 font-medium text-[13px] text-foreground/75 hover:text-foreground transition-colors duration-200 group whitespace-nowrap"
              >
                {lang === 'en' ? l.label_en : l.label_bn}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[hsl(var(--sm-gold))] group-hover:w-3/4 transition-all duration-300 rounded-full" />
              </a>
            ) : (
              <a
                key={l.key}
                href={resolveHref(l.href)}
                onMouseEnter={!isHome ? prefetchHome : undefined}
                className="relative px-3 py-2 font-medium text-[13px] text-foreground/75 hover:text-foreground transition-colors duration-200 group whitespace-nowrap"
              >
                {lang === 'en' ? l.label_en : l.label_bn}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[hsl(var(--sm-gold))] group-hover:w-3/4 transition-all duration-300 rounded-full" />
              </a>
            )
          )}

          {/* Categories dropdown */}
          <div className="relative" ref={navCatRef}>
            <button
              type="button"
              onClick={() => setNavCatOpen(v => !v)}
              className={`relative flex items-center gap-1 px-3 py-2 font-medium text-[13px] transition-colors duration-200 whitespace-nowrap ${
                navCatOpen ? 'text-foreground' : 'text-foreground/75 hover:text-foreground'
              }`}
            >
              {categoriesLabel}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${navCatOpen ? 'rotate-180' : ''}`} />
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[hsl(var(--sm-gold))] transition-all duration-300 rounded-full ${navCatOpen ? 'w-3/4' : 'w-0'}`} />
            </button>

            {navCatOpen && (
              <div className="absolute top-full right-0 mt-0 w-56 bg-popover border border-border rounded-b-xl shadow-2xl z-[300] py-2 overflow-hidden">
                <div className="px-4 py-2 border-b border-border/60 mb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {lang === 'en' ? 'Browse by Category' : 'ক্যাটাগরি অনুযায়ী দেখুন'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavCategoryClick('all')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="h-3 w-3 text-primary" />
                  </span>
                  <span className="font-medium">{lang === 'en' ? 'All Products' : 'সকল পণ্য'}</span>
                </button>

                {dbCategories.length > 0 && <div className="h-px bg-border/50 mx-4 my-1" />}

                {dbCategories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleNavCategoryClick(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 transition-colors group"
                  >
                    <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 font-bold text-[10px] bg-[hsl(var(--sm-gold))]/15 text-[hsl(var(--sm-gold))]">
                      {(lang === 'en' ? c.name_en : (c.name_bn || c.name_en)).charAt(0)}
                    </span>
                    <span className="text-sm group-hover:text-foreground transition-colors">
                      {lang === 'en' ? c.name_en : (c.name_bn || c.name_en)}
                    </span>
                  </button>
                ))}

                <div className="border-t border-border/60 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => { setNavCatOpen(false); navigate('/catalog'); }}
                    className="w-full text-center px-4 py-2 text-xs font-semibold text-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold))]/5 transition-colors"
                  >
                    {lang === 'en' ? 'View Full Catalog →' : 'সম্পূর্ণ ক্যাটালগ দেখুন →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden ml-auto p-1" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* ── Mobile search bar ── */}
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

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/50 px-4 pb-4">
          {allLinks.map(l =>
            l.type === 'route' ? (
              <Link
                key={l.key}
                to={l.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-medium text-sm hover:text-primary transition-colors border-b border-border/30 last:border-0"
              >
                {lang === 'en' ? l.label_en : l.label_bn}
              </Link>
            ) : l.type === 'external' ? (
              <a
                key={l.key}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-medium text-sm hover:text-primary transition-colors border-b border-border/30 last:border-0"
              >
                {lang === 'en' ? l.label_en : l.label_bn}
              </a>
            ) : (
              <a
                key={l.key}
                href={resolveHref(l.href)}
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-medium text-sm hover:text-primary transition-colors border-b border-border/30 last:border-0"
              >
                {lang === 'en' ? l.label_en : l.label_bn}
              </a>
            )
          )}

          {/* Mobile categories accordion */}
          <div className="border-b border-border/30">
            <button
              type="button"
              onClick={() => setMobileCatOpen(v => !v)}
              className="w-full flex items-center justify-between py-3 font-medium text-sm hover:text-primary transition-colors"
            >
              <span>{categoriesLabel}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileCatOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileCatOpen && (
              <div className="pb-3 pl-3 space-y-1">
                <button
                  type="button"
                  onClick={() => { navigate('/catalog'); setMobileOpen(false); }}
                  className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {lang === 'en' ? 'All Products' : 'সকল পণ্য'}
                </button>
                {dbCategories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { navigate(`/catalog?category=${c.id}`); setMobileOpen(false); }}
                    className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {lang === 'en' ? c.name_en : (c.name_bn || c.name_en)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
