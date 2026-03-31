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

  if (len === 0) {
    return (
      <section id="home" className="relative bg-[#0a1628] min-h-[420px] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </section>
    );
  }

  const centerItem = items[current];
  const leftItem = len > 1 ? items[safeIdx(current - 1)] : null;
  const rightItem = len > 1 ? items[safeIdx(current + 1)] : null;

  return (
    <section id="home" className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0f2040 50%, #0a1628 100%)' }}>
      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center px-4 py-12 md:py-16 lg:py-20 touch-pan-y"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 3D Coverflow Area */}
        <div className="relative w-full max-w-3xl mx-auto h-[320px] sm:h-[380px] md:h-[420px]" style={{ perspective: '1200px' }}>
          
          {/* Left card */}
          {leftItem && (
            <div
              className="absolute top-1/2 left-1/2 cursor-pointer"
              style={{
                width: 'clamp(140px, 22vw, 220px)',
                height: 'clamp(180px, 28vw, 280px)',
                transform: 'translate(-50%, -50%) translateX(clamp(-220px, -28vw, -160px)) scale(0.78) rotateY(30deg)',
                transformOrigin: 'right center',
                opacity: 0.6,
                zIndex: 2,
                transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              onClick={prev}
            >
              <div className="w-full h-full rounded-xl overflow-hidden bg-white/95 shadow-2xl shadow-black/30">
                <div className="w-full h-full p-3 flex items-center justify-center">
                  <OptimizedImage src={leftItem.img} alt={leftItem.label}
                    className="w-full h-full object-contain" blurPlaceholder={false} />
                </div>
              </div>
            </div>
          )}

          {/* Center card */}
          <div
            className="absolute top-1/2 left-1/2 cursor-pointer"
            style={{
              width: 'clamp(200px, 30vw, 300px)',
              height: 'clamp(260px, 38vw, 380px)',
              transform: 'translate(-50%, -50%) scale(1)',
              zIndex: 10,
              transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onClick={() => navigate(`/product/${centerItem.id}`)}
          >
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5),0_0_40px_-10px_rgba(59,130,246,0.15)]">
              {/* Product image */}
              <div className="w-full h-[calc(100%-56px)] p-4 flex items-center justify-center">
                <OptimizedImage src={centerItem.img} alt={centerItem.label}
                  className="w-full h-full object-contain drop-shadow-md" blurPlaceholder={false} />
              </div>
              {/* Product name label */}
              <div className="h-[56px] flex items-center justify-center bg-gradient-to-t from-gray-50 to-white border-t border-gray-100 px-4">
                <span className="text-sm font-semibold text-gray-700 truncate text-center leading-tight">
                  {centerItem.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right card */}
          {rightItem && (
            <div
              className="absolute top-1/2 left-1/2 cursor-pointer"
              style={{
                width: 'clamp(140px, 22vw, 220px)',
                height: 'clamp(180px, 28vw, 280px)',
                transform: 'translate(-50%, -50%) translateX(clamp(160px, 28vw, 220px)) scale(0.78) rotateY(-30deg)',
                transformOrigin: 'left center',
                opacity: 0.6,
                zIndex: 2,
                transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              onClick={next}
            >
              <div className="w-full h-full rounded-xl overflow-hidden bg-white/95 shadow-2xl shadow-black/30">
                <div className="w-full h-full p-3 flex items-center justify-center">
                  <OptimizedImage src={rightItem.img} alt={rightItem.label}
                    className="w-full h-full object-contain" blurPlaceholder={false} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-5 mt-6">
          <button onClick={prev}
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {items.slice(0, Math.min(len, 12)).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-400 ${
                  i === current
                    ? 'w-7 h-2.5 bg-white shadow-sm'
                    : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
                }`} />
            ))}
          </div>

          <button onClick={next}
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
