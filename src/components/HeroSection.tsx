import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const SPEED = 3500;

const HeroSection = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [angle, setAngle] = useState(0);
  const [paused, setPaused] = useState(false);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const speedRef = useRef(0.015); // degrees per ms — continuous rotation speed

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

  // Continuous smooth rotation via requestAnimationFrame
  useEffect(() => {
    if (paused || len < 2) return;

    const animate = (time: number) => {
      if (lastTimeRef.current) {
        const delta = time - lastTimeRef.current;
        setAngle(prev => (prev + speedRef.current * delta) % 360);
      }
      lastTimeRef.current = time;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = 0;
    };
  }, [paused, len]);

  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDelta.current = 0; setPaused(true); };
  const onTouchMove = (e: TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDelta.current = delta;
    setAngle(prev => prev - delta * 0.15);
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => { setPaused(false); };

  if (len === 0) {
    return (
      <section id="home" className="relative min-h-[400px] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #142240 50%, #0a1628 100%)' }}>
        <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </section>
    );
  }

  const radius = 300;
  const cardW = 160;
  const cardH = 200;

  return (
    <section id="home" className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1d35 40%, #142240 60%, #0a1628 100%)' }}>

      {/* Ambient glow */}
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
        {/* Circular orbit container */}
        <div
          className="relative w-full max-w-3xl mx-auto h-[320px] sm:h-[380px] md:h-[430px] flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          {items.map((item, i) => {
            const itemAngle = (360 / len) * i + angle;
            const rad = (itemAngle * Math.PI) / 180;

            // Circular path: X from sin, Z from cos
            const x = Math.sin(rad) * radius;
            const z = Math.cos(rad) * radius;

            // Normalize z: -radius to +radius → 0 to 1
            const depthNorm = (z + radius) / (2 * radius); // 0=back, 1=front
            const scale = 0.5 + depthNorm * 0.5;
            const opacity = 0.25 + depthNorm * 0.75;
            const zIndex = Math.round(depthNorm * 100);
            const blur = depthNorm < 0.3 ? `blur(${Math.round((0.3 - depthNorm) * 6)}px)` : 'none';

            const isFront = depthNorm > 0.9;

            return (
              <div
                key={item.id}
                className="absolute cursor-pointer"
                style={{
                  width: cardW,
                  height: cardH,
                  left: '50%',
                  top: '50%',
                  marginLeft: -cardW / 2,
                  marginTop: -cardH / 2,
                  transform: `translateX(${x}px) scale(${scale})`,
                  opacity,
                  zIndex,
                  filter: blur,
                  // No CSS transition — driven by rAF for smooth continuous motion
                }}
                onClick={() => {
                  if (isFront) navigate(`/product/${item.id}`);
                }}
              >
                <div
                  className="w-full h-full rounded-2xl overflow-hidden"
                  style={{
                    background: '#ffffff',
                    boxShadow: isFront
                      ? '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)'
                      : '0 8px 24px -6px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Image */}
                  <div className={`w-full ${isFront ? 'h-[calc(100%-44px)]' : 'h-full'} p-3 flex items-center justify-center`}>
                    <OptimizedImage
                      src={item.img}
                      alt={item.label}
                      className="w-full h-full object-contain"
                      blurPlaceholder={false}
                    />
                  </div>

                  {/* Label — front card only */}
                  {isFront && (
                    <div className="h-[44px] flex items-center justify-center px-3"
                      style={{ borderTop: '1px solid #eee' }}>
                      <span className="text-xs font-semibold truncate text-center" style={{ color: '#333' }}>
                        {item.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5 mt-2">
          <button onClick={() => setAngle(a => a - 360 / len)} aria-label="Previous"
            className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300 active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setPaused(p => !p)}
            className="px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/50 hover:text-white text-xs tracking-wider uppercase transition-all duration-300">
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>

          <button onClick={() => setAngle(a => a + 360 / len)} aria-label="Next"
            className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300 active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
