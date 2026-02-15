import { useLanguage } from '@/contexts/LanguageContext';
import { Award, Users, Package, Layers } from 'lucide-react';

const stats = [
  { icon: Award, value: '10+', key: 'about.stat1.label' },
  { icon: Users, value: '200+', key: 'about.stat2.label' },
  { icon: Package, value: '5000+', key: 'about.stat3.label' },
  { icon: Layers, value: '50+', key: 'about.stat4.label' },
];

const AboutSection = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('about.title')}</h2>
        <div className="w-16 h-1 bg-sm-red mx-auto mb-8 rounded" />
        <p className="text-muted-foreground text-center max-w-3xl mx-auto text-lg mb-12 leading-relaxed">
          {t('about.desc')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-background rounded-xl p-6 text-center shadow-sm hover-lift">
              <s.icon className="h-8 w-8 mx-auto mb-3 text-sm-red" />
              <div className="text-3xl font-bold mb-1">{s.value}</div>
              <div className="text-muted-foreground text-sm">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
