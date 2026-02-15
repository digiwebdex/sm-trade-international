import { useLanguage } from '@/contexts/LanguageContext';
import { Building2 } from 'lucide-react';

const clients = [
  'Bangladesh Public Administration Training Centre (BPATC)',
  'Bangabandhu Sheikh Mujibur Rahman Tunnel Authority',
  'Various Government Ministries',
  'Private Corporations',
  'NGOs & International Organizations',
  'Educational Institutions',
];

const ClientsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('clients.title')}</h2>
        <div className="w-16 h-1 bg-sm-red mx-auto mb-4 rounded" />
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">{t('clients.subtitle')}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {clients.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-secondary rounded-lg p-4 hover-lift">
              <Building2 className="h-5 w-5 text-sm-red shrink-0" />
              <span className="text-sm font-medium">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
