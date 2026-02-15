import { Phone, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TopBar = () => {
  const { lang, toggleLang } = useLanguage();

  return (
    <div className="bg-sm-black text-primary-foreground py-2 text-sm">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <a href="tel:+8801867666888" className="flex items-center gap-1 hover:text-sm-red transition-colors">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+88 01867666888</span>
          </a>
          <a href="mailto:smtrade.int94@gmail.com" className="flex items-center gap-1 hover:text-sm-red transition-colors">
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">smtrade.int94@gmail.com</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/8801867666888"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[hsl(142,70%,40%)] text-white px-3 py-0.5 rounded text-xs font-medium hover:bg-[hsl(142,70%,35%)] transition-colors"
          >
            WhatsApp
          </a>
          <button
            onClick={toggleLang}
            className="border border-primary-foreground/30 px-3 py-0.5 rounded text-xs font-medium hover:bg-primary-foreground/10 transition-colors"
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
