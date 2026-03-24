import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Building2, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ClientsSection = () => {
  const { t, lang } = useLanguage();

  const { data: dbClients = [], isLoading } = useQuery({
    queryKey: ['public-client-logos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_logos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fallback hardcoded clients if DB is empty
  const fallbackClients = [
    'Bangladesh Public Administration Training Centre (BPATC)',
    'Bangabandhu Sheikh Mujibur Rahman Tunnel Authority',
    'Various Government Ministries',
    'Private Corporations',
    'NGOs & International Organizations',
    'Educational Institutions',
  ];

  const clients = dbClients.length > 0
    ? dbClients.map(c => ({ name: c.name, logo: c.logo_url, url: c.website_url }))
    : fallbackClients.map(name => ({ name, logo: null, url: null }));

  return (
    <section className="py-24 relative overflow-hidden">
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {clients.map((c, i) => {
              const content = (
                <div
                  key={i}
                  className="group relative flex items-center gap-4 bg-background rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 group-hover:bg-primary transition-colors duration-300" />
                  <Star className="absolute top-2 right-2 h-3 w-3 text-[hsl(var(--sm-gold))]/30 group-hover:text-[hsl(var(--sm-gold))]/60 transition-colors duration-300" />

                  {c.logo ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white flex items-center justify-center">
                      <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-300">
                      <Building2 className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                  )}
                  <span className="text-sm font-medium pl-1">{c.name}</span>
                </div>
              );

              if (c.url) {
                return (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="block">
                    {content}
                  </a>
                );
              }
              return content;
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ClientsSection;
