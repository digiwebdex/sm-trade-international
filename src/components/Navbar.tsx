import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.jpeg';

const Navbar = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { key: 'nav.home', href: '#home' },
    { key: 'nav.about', href: '#about' },
    { key: 'nav.services', href: '#services' },
    { key: 'nav.products', href: '#products' },
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
      <div className="container mx-auto px-4 flex items-center justify-between h-16 relative">
        <a href="#home" className="flex items-center gap-3 group">
          <img src={logo} alt="S. M. Trade International" className="h-10 w-auto rounded" />
          <div className="hidden md:flex items-center gap-3">
            <div className="w-px h-7 bg-[hsl(var(--sm-gold))]/40" />
            <span className="font-bold text-xl">S. M. Trade International</span>
          </div>
        </a>
        <span className="md:hidden absolute left-1/2 -translate-x-1/2 font-bold text-sm tracking-wide text-center leading-tight">
          S. M. Trade International
        </span>
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <a
              key={l.key}
              href={l.href}
              className="relative px-4 py-2 font-medium text-sm text-foreground/80 hover:text-foreground transition-colors duration-300 group"
            >
              {t(l.key)}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[hsl(var(--sm-gold))] group-hover:w-3/4 transition-all duration-300 rounded-full" />
            </a>
          ))}
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/50 px-4 pb-4">
          {links.map(l => (
            <a
              key={l.key}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 font-medium hover:text-primary transition-colors border-b border-border/30 last:border-0"
            >
              {t(l.key)}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
