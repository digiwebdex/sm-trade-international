import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import heroBg from '@/assets/hero-bg.jpg';

let hasAnimated = false;
const SPEED = 4000;

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const isFirstLoad = !hasAnimated;

  useEffect(() => { if (!hasAnimated) hasAnimated = true; }, []);
  const anim = (delay: string) =>
    isFirstLoad ? { animation: `heroFadeUp 0.7s ${delay} ease-out both` } : {};

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));
  const stats = [1, 2, 3, 4].map(n => ({
    value: get('hero', `stat${n}_value`, n === 1 ? '500+' : n === 2 ? '10+' : n === 3 ? '1000+' : '50+'),
    label: get('hero', `stat${n}_label`, n === 1 ? 'Clients' : n === 2 ? 'Years' : n === 3 ? 'Products' : 'Countries'),
  }));

  const { data: dbProducts } = useQuery({
    queryKey: ['hero-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, image_url, product_code')
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = (dbProducts || []).map(p => ({
    img: p.image_url || '',
    label: lang === 'en' ? p.name_en : (p.name_bn || p.name_en),
    id: p.id,
  }));

  const len = items.length;
  const safeIdx = (i: number) => ((i % len) + len) % len;

  const next = useCallback(() => { if (len > 1) setCurrent(c => (c + 1) % len); }, [len]);
  const prev = useCallback(() => { if (len > 1) setCurrent(c => (c - 1 + len) % len); }, [len]);

  useEffect(() => {
    if (paused || len < 2) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, len]);

  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDelta.current = 0; setPaused(true); };
  const onTouchMove = (e: TouchEvent) => { touchDelta.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd = () => { if (touchDelta.current > 50) prev(); else if (touchDelta.current < -50) next(); setPaused(false); };

  // Build visible card positions: far-left, left, center, right, far-right
  const positions = [
    { offset: -2, x: '-110%', scale: 0.5, rotateY: 45, z: -100, opacity: 0.3, blur: 2 },
    { offset: -1, x: '-60%',  scale: 0.72, rotateY: 30, z: -50, opacity: 0.65, blur: 0 },
    { offset: 0,  x: '-50%',  scale: 1,    rotateY: 0,  z: 0,   opacity: 1, blur: 0 },
    { offset: 1,  x: '-40%',  scale: 0.72, rotateY: -30, z: -50, opacity: 0.65, blur: 0 },
    { offset: 2,  x: '10%',   scale: 0.5,  rotateY: -45, z: -100, opacity: 0.3, blur: 2 },
  ];

  return (
    <section id="home" className="relative bg-foreground" style={{ overflow: 'clip' }}>
      <OptimizedImage src={heroBg} alt="" priority blurPlaceholder={false}
        className="absolute inset-0 w-full h-full object-cover opacity-20" wrapperClassName="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/70 to-primary/30" />

      <div className="relative z-10 container mx-auto px-4 pt-4 pb-8 lg:pt-6 lg:pb-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[500px] lg:min-h-[560px]">

          {/* Left — Copy */}
          <div className="flex flex-col justify-center" style={anim('0s')}>
            <p className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-3 font-medium"
              style={{ fontFamily: 'DM Sans, sans-serif', ...anim('0.05s') }}>
              S.M. Trade International
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 text-white"
              style={anim('0.1s')}>{title}</h1>
            <p className="text-base md:text-lg text-white/60 mb-8 max-w-lg leading-relaxed"
              style={{ fontFamily: 'DM Sans, sans-serif', ...anim('0.2s') }}>{subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-4" style={anim('0.3s')}>
              <Button asChild size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-lg shadow-lg">
                <a href="#contact">
                  <span className="flex items-center gap-2 font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {ctaPrimary}<ArrowRight className="w-5 h-5" />
                  </span>
                </a>
              </Button>
              <Button asChild variant="outline" size="lg"
                className="border-white/20 text-white bg-white/5 backdrop-blur-sm px-8 py-6 text-base rounded-lg hover:bg-white/10 hover:border-white/30">
                <a href="#products">
                  <span className="font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>{t('hero.contact')}</span>
                </a>
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10" style={anim('0.5s')}>
              {stats.map(s => (
                <div key={s.label}>
                  <div className="text-white font-bold text-xl md:text-2xl" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
                  <div className="text-white/40 text-[10px] md:text-xs tracking-wider uppercase" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Premium Coverflow Carousel */}
          {len > 0 && (
            <div
              className="relative flex flex-col items-center justify-center touch-pan-y"
              style={anim('0.4s')}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Soft ambient glow behind cards */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/8 blur-[80px] pointer-events-none" />

              {/* Cards container */}
              <div className="relative w-full max-w-[480px] h-[320px] sm:h-[360px] mx-auto"
                style={{ perspective: '1200px' }}>

                {positions.map(pos => {
                  if (len < 3 && Math.abs(pos.offset) > 1) return null;
                  if (len < 2 && pos.offset !== 0) return null;
                  const idx = safeIdx(current + pos.offset);
                  const item = items[idx];
                  if (!item) return null;
                  const isCenter = pos.offset === 0;

                  return (
                    <div
                      key={`${pos.offset}-${idx}`}
                      className="absolute top-1/2"
                      style={{
                        left: '50%',
                        width: isCenter ? '240px' : Math.abs(pos.offset) === 1 ? '180px' : '130px',
                        height: isCenter ? '300px' : Math.abs(pos.offset) === 1 ? '230px' : '170px',
                        transform: `translateX(${pos.x}) translateY(-50%) translateZ(${pos.z}px) rotateY(${pos.rotateY}deg) scale(${pos.scale})`,
                        opacity: pos.opacity,
                        zIndex: 10 - Math.abs(pos.offset) * 3,
                        transition: 'all 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: pos.blur ? `blur(${pos.blur}px)` : 'none',
                        cursor: isCenter ? 'pointer' : 'pointer',
                      }}
                      onClick={() => {
                        if (isCenter) navigate(`/product/${item.id}`);
                        else if (pos.offset < 0) prev();
                        else next();
                      }}
                    >
                      <div
                        className="w-full h-full rounded-2xl overflow-hidden relative"
                        style={{
                          background: 'linear-gradient(160deg, #ffffff 0%, #f5f3ef 50%, #ede9e3 100%)',
                          boxShadow: isCenter
                            ? '0 30px 80px -20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.9)'
                            : '0 15px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
                        }}
                      >
                        {/* Gold accent line at top for center card */}
                        {isCenter && (
                          <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                        )}

                        {/* Product image */}
                        <div className={`w-full ${isCenter ? 'h-[calc(100%-44px)]' : 'h-full'} p-4 flex items-center justify-center`}>
                          <OptimizedImage
                            src={item.img}
                            alt={item.label}
                            className="w-full h-full object-contain drop-shadow-lg"
                            sizes={isCenter ? '240px' : '180px'}
                            blurPlaceholder={false}
                          />
                        </div>

                        {/* Label — only on center card */}
                        {isCenter && (
                          <div className="absolute bottom-0 inset-x-0 h-11 flex items-center justify-center bg-gradient-to-t from-white/80 to-white/20 backdrop-blur-sm">
                            <span className="text-xs font-bold text-foreground/80 truncate px-3 tracking-wide uppercase"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}>
                              {item.label}
                            </span>
                          </div>
                        )}

                        {/* Subtle shine overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-2xl" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controls row */}
              <div className="flex items-center gap-4 mt-2">
                <button onClick={prev}
                  className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all duration-300 hover:scale-110">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {items.slice(0, Math.min(len, 10)).map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`rounded-full transition-all duration-500 ${
                        i === current
                          ? 'w-7 h-2.5 bg-gradient-to-r from-accent to-accent/70 shadow-md shadow-accent/30'
                          : 'w-2.5 h-2.5 bg-white/15 hover:bg-white/35'
                      }`} />
                  ))}
                </div>

                <button onClick={next}
                  className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/60 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all duration-300 hover:scale-110">
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button onClick={() => setPaused(p => !p)}
                  className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 transition-all duration-300"
                  title={paused ? 'Play' : 'Pause'}>
                  {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
