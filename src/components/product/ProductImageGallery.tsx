import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Monitor, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImageType = 'main' | 'front' | 'back' | 'left' | 'right' | 'gallery';

export interface TypedImage {
  id?: string;
  url: string;
  image_type?: ImageType;
  label?: string;
  variant_id?: string | null;
}

interface ProductImageGalleryProps {
  images: TypedImage[];          // All product + variant images combined
  selectedVariantId?: string | null;
  title: string;
}

const TYPE_LABELS: Record<ImageType, string> = {
  main: 'Main',
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
  gallery: 'Gallery',
};

function thumbUrl(src: string, width = 160): string {
  if (!src || !src.includes('supabase.co/storage')) return src;
  try {
    const url = new URL(src);
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', '75');
    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch {
    return src;
  }
}

const ProductImageGallery = ({
  images,
  selectedVariantId,
  title,
}: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [fade, setFade] = useState(true);
  const touchStart = useRef<number | null>(null);

  // Reset to first when variant changes — prefer variant-specific images
  useEffect(() => {
    setFade(false);
    const timer = setTimeout(() => {
      if (selectedVariantId) {
        const variantIdx = images.findIndex(img => img.variant_id === selectedVariantId);
        setSelectedIndex(variantIdx >= 0 ? variantIdx : 0);
      } else {
        setSelectedIndex(0);
      }
      setFade(true);
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedVariantId, images]);

  const selectIndex = useCallback((idx: number) => {
    if (idx === selectedIndex) return;
    setFade(false);
    setTimeout(() => {
      setSelectedIndex(idx);
      setFade(true);
    }, 100);
  }, [selectedIndex]);

  const goNext = useCallback(() => selectIndex((selectedIndex + 1) % images.length), [selectedIndex, images.length, selectIndex]);
  const goPrev = useCallback(() => selectIndex((selectedIndex - 1 + images.length) % images.length), [selectedIndex, images.length, selectIndex]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    touchStart.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-muted border border-border/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{title}</p>
        </div>
      </div>
    );
  }

  const safeIdx = selectedIndex >= images.length ? 0 : selectedIndex;
  const current = images[safeIdx];

  return (
    <div className="space-y-3 select-none">
      {/* Main image */}
      <div
        className="relative group aspect-square rounded-2xl overflow-hidden bg-white border border-border/20 shadow-md cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => { setIsZoomed(false); setZoomPos({ x: 50, y: 50 }); }}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current.url ? (
          <div className="w-full h-full overflow-hidden">
            <img
              src={current.url}
              alt={current.label || title}
              className={cn(
                'w-full h-full object-contain p-4 transition-all duration-300',
                isZoomed ? 'scale-[2.2]' : 'scale-100',
                fade ? 'opacity-100' : 'opacity-0',
              )}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              loading="eager"
              decoding="async"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Square className="h-16 w-16 opacity-10" />
          </div>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image type badge */}
        {current.image_type && current.image_type !== 'main' && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur text-[10px] font-semibold uppercase tracking-wider border border-border/40">
            {TYPE_LABELS[current.image_type] || current.image_type}
          </span>
        )}

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-50 transition-opacity">
          <ZoomIn className="h-4 w-4" />
        </div>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            {safeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 5-View slot strip — always show Main/Front/Back/Left/Right */}
      {(() => {
        const VIEW_SLOTS: ImageType[] = ['main', 'front', 'back', 'left', 'right'];
        const hasAnyView = images.some(img => VIEW_SLOTS.includes(img.image_type as ImageType));
        const slots = hasAnyView ? VIEW_SLOTS : null;

        if (!slots && images.length <= 1) return null;

        if (slots) {
          return (
            <div className="flex gap-2 justify-between">
              {VIEW_SLOTS.map(viewType => {
                const imgIdx = images.findIndex(img => img.image_type === viewType);
                const img = imgIdx >= 0 ? images[imgIdx] : null;
                const isActive = safeIdx === imgIdx && imgIdx >= 0;

                return (
                  <button
                    key={viewType}
                    onClick={() => img ? selectIndex(imgIdx) : undefined}
                    disabled={!img}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 group',
                      !img && 'opacity-40 cursor-default'
                    )}
                    title={TYPE_LABELS[viewType]}
                  >
                    <div className={cn(
                      'w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 bg-muted/40 flex items-center justify-center',
                      isActive
                        ? 'border-[hsl(var(--sm-gold))] ring-2 ring-[hsl(var(--sm-gold))]/30 shadow-md'
                        : img
                          ? 'border-border/30 hover:border-border hover:shadow-sm'
                          : 'border-dashed border-border/30',
                    )}>
                      {img ? (
                        <img
                          src={thumbUrl(img.url)}
                          alt={TYPE_LABELS[viewType]}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <svg className="h-5 w-5 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <path d="M3 9l4-4 4 4 4-4 4 4" />
                        </svg>
                      )}
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider transition-colors',
                      isActive ? 'text-[hsl(var(--sm-gold))]' : 'text-muted-foreground',
                    )}>
                      {TYPE_LABELS[viewType]}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        }

        // Fallback: generic thumbnail strip for non-typed images
        return (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin snap-x">
            {images.map((img, idx) => (
              <button
                key={`${img.url}-${idx}`}
                onClick={() => selectIndex(idx)}
                className={cn(
                  'shrink-0 snap-start relative w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200',
                  safeIdx === idx
                    ? 'border-[hsl(var(--sm-gold))] ring-2 ring-[hsl(var(--sm-gold))]/30 scale-105 shadow-md'
                    : 'border-border/30 hover:border-border hover:scale-[1.03]',
                )}
                title={img.image_type ? TYPE_LABELS[img.image_type as ImageType] : img.label}
              >
                <img
                  src={thumbUrl(img.url)}
                  alt={img.label || `${title} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={72}
                  height={72}
                />
              </button>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

export default ProductImageGallery;
