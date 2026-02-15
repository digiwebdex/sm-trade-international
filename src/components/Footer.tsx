import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.jpeg';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-sm-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Logo" className="h-10 rounded" />
              <span className="font-bold text-lg">S.M. Trade International</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{t('footer.desc')}</p>
          </div>

          <div>
            <h4 className="font-bold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{t('footer.quicklinks')}</h4>
            <div className="space-y-2">
              {['nav.home', 'nav.about', 'nav.services', 'nav.products', 'nav.contact'].map(k => (
                <a key={k} href={`#${k.split('.')[1]}`} className="block text-white/60 hover:text-sm-red text-sm transition-colors">
                  {t(k)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{t('footer.contactinfo')}</h4>
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{t('contact.addressValue')}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />+88 01867666888</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" />smtrade.int94@gmail.com</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} S.M. Trade International. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
