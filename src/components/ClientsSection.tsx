import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Star } from 'lucide-react';

const clients = [
  'Bangladesh Public Administration Training Centre (BPATC)',
  'Bangabandhu Sheikh Mujibur Rahman Tunnel Authority',
  'Various Government Ministries',
  'Private Corporations',
  'NGOs & International Organizations',
  'Educational Institutions',
];

const ClientsSection = () => {
  const { t, lang } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle diagonal pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--sm-gold)) 0, hsl(var(--sm-gold)) 1px, transparent 0, transparent 50%)',
        backgroundSize: '20px 20px',
      }} />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Trusted By' : 'বিশ্বস্ত'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('clients.title')}</h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rotate-45 bg-accent/70" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">{t('clients.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {clients.map((c, i) => (
            <div
              key={i}
              className="group relative flex items-center gap-4 bg-background rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 overflow-hidden"
            >
              {/* Emerald left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 group-hover:bg-primary transition-colors duration-300" />
              
              {/* Gold star decoration */}
              <Star className="absolute top-2 right-2 h-3 w-3 text-[hsl(var(--sm-gold))]/30 group-hover:text-[hsl(var(--sm-gold))]/60 transition-colors duration-300" />

              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-300">
                <Building2 className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <span className="text-sm font-medium pl-1">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
