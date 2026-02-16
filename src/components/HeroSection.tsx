import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const stats = [
  { icon: '🏢', value: '500+', label: 'Clients' },
  { icon: '⏳', value: '10+', label: 'Years' },
  { icon: '🎁', value: '1000+', label: 'Products' },
  { icon: '🌍', value: '50+', label: 'Countries' },
];

const HeroSection = () => {
  const { t } = useLanguage();
  const { get } = useSiteSettings();

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));
  const ctaSecondary = get('hero', 'cta_secondary', t('hero.contact'));

  // Split title to highlight first word with gold gradient
  const words = (title as string).split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <section id="home" className="relative min-h-[600px] lg:min-h-[700px]">
      {/* Full-width hero image */}
      <img
        src={heroBg}
        alt="Premium corporate gifts"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(150,20%,6%)]/85 via-[hsl(150,20%,6%)]/60 to-transparent" />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, hsl(var(--sm-gold)) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'heroGradientShift 8s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-[600px] lg:min-h-[700px]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl flex">
            {/* Gold vertical accent bar */}
            <div className="hidden md:flex flex-col items-center mr-8 pt-2">
              <div
                className="w-[2px] bg-gradient-to-b from-[hsl(var(--sm-gold))] to-transparent rounded-full"
                style={{ animation: 'growHeight 1.2s ease-out both', height: '120px' }}
              />
              <div className="w-2 h-2 rotate-45 bg-[hsl(var(--sm-gold))] mt-3" />
            </div>

            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 bg-[hsl(var(--sm-gold))]/15 backdrop-blur-sm text-[hsl(var(--sm-gold))] text-xs font-semibold px-5 py-2 rounded-full mb-8 tracking-widest uppercase border border-[hsl(var(--sm-gold))]/25"
                style={{ animation: 'heroFadeUp 0.8s ease-out both' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))]" />
                S. M. Trade International
              </div>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6 text-white"
                style={{ animation: 'heroFadeUp 0.8s 0.15s ease-out both' }}
              >
                <span className="text-gradient">{firstWord}</span>{' '}
                {restWords}
              </h1>

              <p
                className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed"
                style={{ animation: 'heroFadeUp 0.8s 0.3s ease-out both', fontFamily: 'DM Sans, sans-serif' }}
              >
                {subtitle}
              </p>

              {/* Gold diamond divider */}
              <div
                className="flex items-center gap-3 mb-8"
                style={{ animation: 'heroFadeUp 0.8s 0.38s ease-out both' }}
              >
                <div className="h-px w-8 bg-[hsl(var(--sm-gold))]/40" />
                <div className="w-2 h-2 rotate-45 bg-[hsl(var(--sm-gold))]/60" />
                <div className="h-px w-8 bg-[hsl(var(--sm-gold))]/40" />
              </div>

              <div
                className="flex flex-col sm:flex-row gap-4 sm:gap-5"
                style={{ animation: 'heroFadeUp 0.8s 0.45s ease-out both' }}
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold-dark))] text-white text-base px-10 py-6 rounded-lg transition-all duration-300 shadow-lg shadow-[hsl(var(--sm-gold))]/20 hover:shadow-xl hover:shadow-[hsl(var(--sm-gold))]/30"
                  style={{ animation: 'pulseGold 3s ease-in-out infinite' }}
                >
                  <a href="#contact">
                    <span className="flex items-center gap-2 font-semibold tracking-wide" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {ctaPrimary}
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/25 text-white bg-white/5 backdrop-blur-sm text-base px-10 py-6 rounded-lg hover:bg-white/15 hover:border-white/40 transition-all duration-300"
                >
                  <a href="#products">
                    <span className="flex items-center gap-2 font-semibold tracking-wide" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {ctaSecondary}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphism stats strip */}
      <div
        className="absolute bottom-12 left-0 right-0 z-10"
        style={{ animation: 'heroFadeUp 0.8s 0.7s ease-out both' }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-white/[0.07] backdrop-blur-md rounded-xl border border-white/10 px-6 py-5">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <div className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stat.value}</div>
                    <div className="text-white/50 text-xs tracking-wide uppercase" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
