import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const SPEED = 4000;
const VISIBLE = 5; // number of cards visible in the circle

const HeroSection = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { get } = useSiteSettings();
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
        style={{ background: 'linear-gradient(180deg, hsl(var(--foreground)) 0%, #0f2040 100%)' }}>
        <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </section>
    );
  }

  // Calculate position for each card in a circular arrangement
  const getCardStyle = (index: number) => {
    // Calculate the shortest distance from current, wrapping around
    let diff = index - current;
    if (diff > len / 2) diff -= len;
    if (diff < -len / 2) diff += len;

    const absDiff = Math.abs(diff);
    
    // Only show cards within visible range
    if (absDiff > Math.floor(VISIBLE / 2)) {
      return { display: 'none' } as React.CSSProperties;
    }

    // Circular arrangement calculations — tight spacing, no gaps
    const angle = diff * (360 / Math.max(len, VISIBLE));
    const radius = 200; // smaller radius = cards closer together
    const radian = (angle * Math.PI) / 180;
    
    // X position along the circle
    const translateX = Math.sin(radian) * radius;
    // Z position (depth) — front is closer
    const translateZ = Math.cos(radian) * radius - radius;
    
    // Scale based on depth (closer = bigger)
    const depthFactor = (translateZ + radius) / (2 * radius); // 0 (far) to 1 (near, but 0.5 = center)
    const scale = 0.55 + depthFactor * 0.45;
    
    // Opacity based on distance
    const opacity = absDiff === 0 ? 1 : Math.max(0.3, 1 - absDiff * 0.3);
    
    // Z-index: center gets highest
    const zIndex = 20 - absDiff * 5;

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
      zIndex,
      transition: 'all 0.7s cubic-bezier(0.33, 0, 0.2, 1)',
    } as React.CSSProperties;
  };

  const centerItem = items[current];

  return (
    <section id="home" className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, hsl(var(--foreground)) 0%, #0f2040 50%, hsl(var(--foreground)) 100%)' }}>
      
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)' }} />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center px-4 py-10 md:py-14 lg:py-18 touch-pan-y"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 3D Circular Carousel */}
        <div
          className="relative w-full max-w-4xl mx-auto h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center"
          style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
        >
          <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {items.map((item, i) => {
              const style = getCardStyle(i);
              if (style.display === 'none') return null;
              const isCenter = i === current;

              return (
                <div
                  key={item.id}
                  className="absolute top-1/2 left-1/2 cursor-pointer"
                  style={{
                    ...style,
                    width: isCenter ? 240 : 180,
                    height: isCenter ? 310 : 240,
                    marginLeft: isCenter ? -120 : -90,
                    marginTop: isCenter ? -155 : -120,
                  }}
                  onClick={() => {
                    if (isCenter) navigate(`/product/${item.id}`);
                    else {
                      let diff = i - current;
                      if (diff > len / 2) diff -= len;
                      if (diff < -len / 2) diff += len;
                      if (diff > 0) next();
                      else prev();
                    }
                  }}
                >
                  <div
                    className={`w-full h-full rounded-2xl overflow-hidden ${
                      isCenter ? 'ring-2 ring-white/20' : ''
                    }`}
                    style={{
                      background: isCenter
                        ? 'linear-gradient(160deg, #ffffff 0%, #f8f8f8 100%)'
                        : 'linear-gradient(160deg, #f5f5f5 0%, #e8e8e8 100%)',
                      boxShadow: isCenter
                        ? '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 30px -5px rgba(59,130,246,0.1)'
                        : '0 10px 30px -8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Image */}
                    <div className={`w-full ${isCenter ? 'h-[calc(100%-50px)]' : 'h-full'} p-3 flex items-center justify-center`}>
                      <OptimizedImage
                        src={item.img}
                        alt={item.label}
                        className="w-full h-full object-contain"
                        blurPlaceholder={false}
                      />
                    </div>

                    {/* Label — center card only */}
                    {isCenter && (
                      <div className="h-[50px] flex items-center justify-center border-t border-gray-100 px-3">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate text-center">
                          {item.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-5 mt-4">
          <button onClick={prev} aria-label="Previous"
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300">
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
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
