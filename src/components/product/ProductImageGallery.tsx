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
  images: TypedImage[];
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
      <div className="aspect-square rounded-lg bg-muted border border-border/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{title}</p>
        </div>
      </div>
    );
  }

  const safeIdx = selectedIndex >= images.length ? 0 : selectedIndex;
  const current = images[safeIdx];

  // Build thumbnail list
  const VIEW_SLOTS: ImageType[] = ['main', 'front', 'back', 'left', 'right'];
  const hasAnyView = images.some(img => VIEW_SLOTS.includes(img.image_type as ImageType));

  return (
    <div className="flex gap-3 select-none">
      {/* LEFT — Vertical thumbnail strip (Amazon-style) */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 w-[56px] shrink-0">
          {hasAnyView ? (
            VIEW_SLOTS.map(viewType => {
              const imgIdx = images.findIndex(img => img.image_type === viewType);
              const img = imgIdx >= 0 ? images[imgIdx] : null;
              if (!img) return null;
              const isActive = safeIdx === imgIdx;
              return (
                <button
                  key={viewType}
                  onClick={() => selectIndex(imgIdx)}
                  onMouseEnter={() => selectIndex(imgIdx)}
                  className={cn(
                    'w-[56px] h-[56px] rounded border-2 overflow-hidden bg-white flex items-center justify-center transition-all',
                    isActive
                      ? 'border-[hsl(var(--sm-gold))] shadow-sm'
                      : 'border-border/40 hover:border-[hsl(var(--sm-gold))]/60',
                  )}
                  title={TYPE_LABELS[viewType]}
                >
                  <img
                    src={thumbUrl(img.url)}
                    alt={TYPE_LABELS[viewType]}
                    className="w-full h-full object-contain p-0.5"
                    loading="lazy"
                  />
                </button>
              );
            })
          ) : (
            images.map((img, idx) => (
              <button
                key={`${img.url}-${idx}`}
                onClick={() => selectIndex(idx)}
                onMouseEnter={() => selectIndex(idx)}
                className={cn(
                  'w-[56px] h-[56px] rounded border-2 overflow-hidden bg-white flex items-center justify-center transition-all',
                  safeIdx === idx
                    ? 'border-[hsl(var(--sm-gold))] shadow-sm'
                    : 'border-border/40 hover:border-[hsl(var(--sm-gold))]/60',
                )}
              >
                <img
                  src={thumbUrl(img.url)}
                  alt={img.label || `View ${idx + 1}`}
                  className="w-full h-full object-contain p-0.5"
                  loading="lazy"
                />
              </button>
            ))
          )}
        </div>
      )}

      {/* RIGHT — Main image */}
      <div className="flex-1">
        <div
          className="relative group aspect-square rounded-lg overflow-hidden bg-white border border-border/20 cursor-crosshair"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-50 transition-opacity">
            <ZoomIn className="h-4 w-4" />
          </div>
        </div>

        {/* Mobile horizontal thumbnails */}
        {images.length > 1 && (
          <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={`m-${img.url}-${idx}`}
                onClick={() => selectIndex(idx)}
                className={cn(
                  'shrink-0 w-14 h-14 rounded border-2 overflow-hidden bg-white',
                  safeIdx === idx
                    ? 'border-[hsl(var(--sm-gold))]'
                    : 'border-border/40',
                )}
              >
                <img
                  src={thumbUrl(img.url)}
                  alt={`View ${idx + 1}`}
                  className="w-full h-full object-contain p-0.5"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductImageGallery;
