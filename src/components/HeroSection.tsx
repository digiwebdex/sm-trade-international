import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const SPEED = 4000;

const HeroSection = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);

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

  if (len === 0) {
    return (
      <section id="home" className="relative min-h-[420px] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #142240 50%, #0a1628 100%)' }}>
        <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </section>
    );
  }

  // Get 3 cards: previous, current, next
  const getIndex = (offset: number) => ((current + offset) % len + len) % len;
  const prevIdx = getIndex(-1);
  const nextIdx = getIndex(1);

  const cards = [
    { idx: prevIdx, position: 'left' as const },
    { idx: current, position: 'center' as const },
    { idx: nextIdx, position: 'right' as const },
  ];

  const cardStyles = {
    left: {
      transform: 'translateX(-170px) scale(0.72) rotateY(12deg)',
      zIndex: 5,
      opacity: 0.7,
      filter: 'brightness(0.85)',
    },
    center: {
      transform: 'translateX(0) scale(1) rotateY(0deg)',
      zIndex: 15,
      opacity: 1,
      filter: 'brightness(1)',
    },
    right: {
      transform: 'translateX(170px) scale(0.72) rotateY(-12deg)',
      zIndex: 5,
      opacity: 0.7,
      filter: 'brightness(0.85)',
    },
  };

  return (
    <section id="home" className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1d35 40%, #142240 60%, #0a1628 100%)' }}>
      
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, rgba(100,140,200,0.06), transparent 60%)' }} />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center px-4 py-10 md:py-14 lg:py-16 touch-pan-y"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 3-Card Coverflow */}
        <div
          className="relative w-full max-w-2xl mx-auto h-[300px] sm:h-[360px] md:h-[420px] flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          {cards.map(({ idx, position }) => {
            const item = items[idx];
            const isCenter = position === 'center';
            const style = cardStyles[position];

            return (
              <div
                key={`${position}-${idx}`}
                className="absolute cursor-pointer"
                style={{
                  width: isCenter ? 280 : 180,
                  height: isCenter ? 370 : 250,
                  left: '50%',
                  top: '50%',
                  marginLeft: isCenter ? -140 : -90,
                  marginTop: isCenter ? -185 : -125,
                  transform: style.transform,
                  zIndex: style.zIndex,
                  opacity: style.opacity,
                  filter: style.filter,
                  transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => {
                  if (isCenter) navigate(`/product/${item.id}`);
                  else if (position === 'left') prev();
                  else next();
                }}
              >
                <div
                  className="w-full h-full rounded-2xl overflow-hidden"
                  style={{
                    background: '#ffffff',
                    boxShadow: isCenter
                      ? '0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                      : '0 12px 30px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Image */}
                  <div className={`w-full ${isCenter ? 'h-[calc(100%-56px)]' : 'h-full'} p-4 flex items-center justify-center`}
                    style={{ background: isCenter ? '#fff' : '#f3f3f3' }}>
                    <OptimizedImage
                      src={item.img}
                      alt={item.label}
                      className="w-full h-full object-contain"
                      blurPlaceholder={false}
                    />
                  </div>

                  {/* Label — center card only */}
                  {isCenter && (
                    <div className="h-[56px] flex items-center justify-center px-4"
                      style={{ borderTop: '1px solid #eee' }}>
                      <span className="text-sm font-semibold truncate text-center"
                        style={{ color: '#333' }}>
                        {item.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation dots */}
        <div className="flex items-center gap-5 mt-4">
          <button onClick={prev} aria-label="Previous"
            className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300 active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {items.slice(0, Math.min(len, 12)).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-500 ${
                  i === current
                    ? 'w-6 h-2 bg-white shadow-sm'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`} />
            ))}
          </div>

          <button onClick={next} aria-label="Next"
            className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300 active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
