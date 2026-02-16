import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Award, Users, Package, Layers } from 'lucide-react';

const icons = [Award, Users, Package, Layers];

const AboutSection = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();

  const title = get('about', 'title', t('about.title'));
  const desc = get('about', 'description', t('about.desc'));

  const stats = [
    { icon: icons[0], value: get('about', 'stat1_value', '10+'), label: get('about', 'stat1_label', t('about.stat1.label')) },
    { icon: icons[1], value: get('about', 'stat2_value', '200+'), label: get('about', 'stat2_label', t('about.stat2.label')) },
    { icon: icons[2], value: get('about', 'stat3_value', '5000+'), label: get('about', 'stat3_label', t('about.stat3.label')) },
    { icon: icons[3], value: get('about', 'stat4_value', '50+'), label: get('about', 'stat4_label', t('about.stat4.label')) },
  ];

  return (
    <section id="about" className="py-24 bg-secondary relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--sm-gold)) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side — Text content */}
          <div>
            <div className="flex items-start gap-5">
              {/* Gold vertical accent bar */}
              <div className="hidden md:block w-1 rounded-full bg-gradient-to-b from-[hsl(var(--sm-gold))] via-[hsl(var(--sm-gold))]/50 to-transparent flex-shrink-0" style={{ height: '180px' }} />
              
              <div>
                <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {lang === 'en' ? 'Who We Are' : 'আমরা কারা'}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{title}</h2>
                
                {/* Gold diamond divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-10 bg-accent/40" />
                  <div className="w-2 h-2 rotate-45 bg-accent/70" />
                  <div className="h-px w-10 bg-accent/40" />
                </div>

                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {desc}
                </p>

                {/* Trusted Since badge */}
                <div className="inline-flex items-center gap-3 border-2 border-[hsl(var(--sm-gold))]/30 rounded-full px-6 py-2.5 bg-background/50">
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--sm-gold))]" />
                  <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {lang === 'en' ? 'Trusted Since 2014' : '২০১৪ সাল থেকে বিশ্বস্ত'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side — Stats 2x2 grid */}
          <div className="grid grid-cols-2 gap-5">
            {stats.map((s, i) => (
              <div
                key={i}
                className="group relative bg-background rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Gold top border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(var(--sm-gold))] to-transparent" />
                
                {/* Emerald icon circle */}
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors duration-300">
                  <s.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                
                <div className="text-3xl font-bold mb-1 text-foreground" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
                <div className="text-muted-foreground text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
