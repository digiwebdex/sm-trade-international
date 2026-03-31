import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const SPEED = 4000;
const TOTAL_VISIBLE = 7;

const HeroSection = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
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
  const anglePerItem = len > 0 ? 360 / len : 0;

  const next = useCallback(() => {
    if (len > 1) setRotation(r => r - anglePerItem);
  }, [len, anglePerItem]);

  const prev = useCallback(() => {
    if (len > 1) setRotation(r => r + anglePerItem);
  }, [len, anglePerItem]);

  useEffect(() => {
    if (paused || len < 2) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, len]);

  // Calculate which item index is currently in front
  const currentIndex = len > 0
    ? ((Math.round(-rotation / anglePerItem) % len) + len) % len
    : 0;

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

  // Radius of the 3D circle — keeps cards close together
  const radius = Math.max(220, len * 28);

  return (
    <section id="home" className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, hsl(var(--foreground)) 0%, #0f2040 50%, hsl(var(--foreground)) 100%)' }}>
      
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 70%)' }} />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center px-4 py-12 md:py-16 lg:py-20 touch-pan-y"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 3D Circular Carousel Container */}
        <div
          className="relative w-full max-w-5xl mx-auto h-[340px] sm:h-[400px] md:h-[440px] flex items-center justify-center"
          style={{ perspective: '1200px' }}
        >
          {/* Rotating ring */}
          <div
            className="absolute w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotation}deg)`,
              transition: 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            {items.map((item, i) => {
              const itemAngle = i * anglePerItem;
              const isFront = i === currentIndex;

              return (
                <div
                  key={item.id}
                  className="absolute top-1/2 left-1/2 cursor-pointer"
                  style={{
                    width: 200,
                    height: 260,
                    marginLeft: -100,
                    marginTop: -130,
                    transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                    transformStyle: 'preserve-3d',
                    transition: 'box-shadow 0.5s ease',
                  }}
                  onClick={() => {
                    if (isFront) {
                      navigate(`/product/${item.id}`);
                    } else {
                      // Calculate shortest rotation to this card
                      let diff = i - currentIndex;
                      if (diff > len / 2) diff -= len;
                      if (diff < -len / 2) diff += len;
                      setRotation(r => r - diff * anglePerItem);
                    }
                  }}
                >
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden backface-visible"
                    style={{
                      background: 'linear-gradient(160deg, #ffffff 0%, #f0f0f0 100%)',
                      boxShadow: isFront
                        ? '0 30px 60px -15px rgba(0,0,0,0.5), 0 0 40px -5px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
                        : '0 10px 30px -8px rgba(0,0,0,0.25)',
                      border: isFront ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {/* Image area */}
                    <div className="w-full h-[calc(100%-48px)] p-3 flex items-center justify-center">
                      <OptimizedImage
                        src={item.img}
                        alt={item.label}
                        className="w-full h-full object-contain drop-shadow-sm"
                        blurPlaceholder={false}
                      />
                    </div>

                    {/* Label */}
                    <div className="h-[48px] flex items-center justify-center border-t border-gray-100 px-3 bg-white/80">
                      <span className="text-xs font-semibold text-gray-700 truncate text-center leading-tight">
                        {item.label}
                      </span>
                    </div>

                    {/* Shine overlay for front card */}
                    {isFront && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reflection/floor effect */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[2px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-5 mt-6">
          <button onClick={prev} aria-label="Previous"
            className="w-11 h-11 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {items.slice(0, Math.min(len, 12)).map((_, i) => (
              <button key={i}
                onClick={() => {
                  let diff = i - currentIndex;
                  if (diff > len / 2) diff -= len;
                  if (diff < -len / 2) diff += len;
                  setRotation(r => r - diff * anglePerItem);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-500 ${
                  i === currentIndex
                    ? 'w-7 h-2 bg-white shadow-sm'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`} />
            ))}
          </div>

          <button onClick={next} aria-label="Next"
            className="w-11 h-11 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
