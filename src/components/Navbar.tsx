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
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur shadow-md' : 'bg-background'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <a href="#home" className="flex items-center gap-2">
          <img src={logo} alt="S.M. Trade International" className="h-10 w-auto rounded" />
          <span className="font-bold text-lg hidden md:inline">S.M. Trade International</span>
        </a>
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.key} href={l.href} className="font-medium hover:text-sm-red transition-colors text-sm">
              {t(l.key)}
            </a>
          ))}
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-background border-t px-4 pb-4">
          {links.map(l => (
            <a key={l.key} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2 font-medium hover:text-sm-red transition-colors">
              {t(l.key)}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
