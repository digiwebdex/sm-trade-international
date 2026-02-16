import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, PenTool, FlaskConical, Factory, Truck } from 'lucide-react';

const steps = [
  { icon: MessageSquare, titleKey: 'process.1.title', descKey: 'process.1.desc' },
  { icon: PenTool, titleKey: 'process.2.title', descKey: 'process.2.desc' },
  { icon: FlaskConical, titleKey: 'process.3.title', descKey: 'process.3.desc' },
  { icon: Factory, titleKey: 'process.4.title', descKey: 'process.4.desc' },
  { icon: Truck, titleKey: 'process.5.title', descKey: 'process.5.desc' },
];

const ProcessSection = () => {
  const { t, lang } = useLanguage();

  return (
    <section className="py-24 bg-secondary relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'How It Works' : 'কিভাবে কাজ করে'}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">{t('process.title')}</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
        </div>

        {/* Desktop: Alternating timeline */}
        <div className="hidden md:block relative max-w-4xl mx-auto">
          {/* Center vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary -translate-x-1/2" />

          <div className="space-y-12">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className="relative flex items-center">
                  {/* Gold step number on the center line */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[hsl(var(--sm-gold))] flex items-center justify-center shadow-lg shadow-[hsl(var(--sm-gold))]/30">
                    <span className="text-white font-bold text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>{i + 1}</span>
                  </div>

                  {/* Card on alternating side */}
                  <div className={`w-[45%] ${isLeft ? 'mr-auto pr-8 text-right' : 'ml-auto pl-8 text-left'}`}>
                    <div className="group bg-background rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                      {/* Gold top accent */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--sm-gold))] to-transparent" />
                      
                      <div className={`flex items-center gap-4 mb-3 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                        <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300 ${isLeft ? 'order-last' : ''}`}>
                          <step.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <h3 className="font-bold text-base" style={{ fontFamily: 'DM Sans, Noto Sans Bengali, sans-serif' }}>
                          {t(step.titleKey)}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden relative pl-12">
          {/* Left vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary" />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {/* Step number */}
                <div className="absolute -left-7 top-4 w-8 h-8 rounded-full bg-[hsl(var(--sm-gold))] flex items-center justify-center shadow-md z-10">
                  <span className="text-white font-bold text-xs">{i + 1}</span>
                </div>

                <div className="bg-background rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'DM Sans, Noto Sans Bengali, sans-serif' }}>
                      {t(step.titleKey)}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
