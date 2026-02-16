import { useEffect, useCallback, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxItem {
  src: string;
  title: string;
}

interface GalleryLightboxProps {
  items: LightboxItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const GalleryLightbox = ({ items, currentIndex, onClose, onNavigate }: GalleryLightboxProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStart = useRef<number | null>(null);
  const item = items[currentIndex];

  const navigate = useCallback((dir: 1 | -1) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const next = (currentIndex + dir + items.length) % items.length;
    onNavigate(next);
    setTimeout(() => setIsAnimating(false), 200);
  }, [currentIndex, items.length, onNavigate, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, navigate]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? -1 : 1);
    }
    touchStart.current = null;
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white/70 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-sm font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-4">
        {/* Prev */}
        <button
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          onClick={e => { e.stopPropagation(); navigate(-1); }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>

        {/* Image */}
        <div
          className="max-w-4xl w-full flex items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl p-4 md:p-8 max-h-[65vh] flex items-center justify-center animate-scale-in">
            <img
              src={item.src}
              alt={item.title}
              className="max-w-full max-h-[55vh] object-contain"
              draggable={false}
            />
          </div>
        </div>

        {/* Next */}
        <button
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          onClick={e => { e.stopPropagation(); navigate(1); }}
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Title */}
      <div className="text-center py-2 shrink-0" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white">{item.title}</h3>
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 pb-4 px-4 overflow-x-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
          {items.map((t, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === currentIndex
                  ? 'border-accent opacity-100 scale-105'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <img
                src={t.src}
                alt={t.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryLightbox;
