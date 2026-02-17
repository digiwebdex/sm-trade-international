import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import { cn } from '@/lib/utils';

/** Build a small optimized thumbnail URL for Supabase images */
function thumbUrl(src: string, width = 160): string {
  if (!src.includes('supabase.co/storage')) return src;
  const url = new URL(src);
  url.searchParams.set('width', String(width));
  url.searchParams.set('quality', '70');
  url.searchParams.set('format', 'webp');
  return url.toString();
}

interface VariantThumb {
  id: string;
  image_url: string | null;
  variant_label_en: string;
  color_hex: string | null;
}

interface GalleryImage {
  url: string;
  label?: string;
  colorHex?: string | null;
  variantId?: string;
}

interface ProductImageGalleryProps {
  mainImage: string;
  productImages: { id: string; image_url: string; sort_order: number }[];
  variantImages: { id: string; image_url: string; sort_order: number }[];
  activeVariantImage?: string | null;
  variants?: VariantThumb[];
  selectedVariantId?: string | null;
  onVariantSelect?: (id: string | null) => void;
  title: string;
}

const ProductImageGallery = ({
  mainImage,
  productImages,
  variantImages,
  activeVariantImage,
  variants = [],
  selectedVariantId,
  onVariantSelect,
  title,
}: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // Build gallery images with metadata
  const allImages = useMemo(() => {
    const images: GalleryImage[] = [];
    const seen = new Set<string>();

    const add = (url: string, label?: string, colorHex?: string | null, variantId?: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      images.push({ url, label, colorHex, variantId });
    };

    // Active variant image first
    if (activeVariantImage) {
      const v = variants.find(v => v.id === selectedVariantId);
      add(activeVariantImage, v?.variant_label_en, v?.color_hex, v?.id);
    }

    // Variant gallery images
    variantImages.forEach(img => add(img.image_url));

    // Other variant images
    variants.forEach(v => {
      if (v.image_url) {
        add(v.image_url, v.variant_label_en, v.color_hex, v.id);
      }
    });

    // Product gallery images
    productImages.forEach(img => add(img.image_url));

    // Main product image
    if (mainImage) add(mainImage, 'Default');

    return images.length > 0 ? images : [{ url: mainImage || '', label: 'Default' }];
  }, [mainImage, productImages, variantImages, activeVariantImage, variants, selectedVariantId]);

  // Reset to first image when variant changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedVariantId]);

  const safeIndex = selectedIndex >= allImages.length ? 0 : selectedIndex;
  const currentImage = allImages[safeIndex];

  const goNext = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => {
    setSelectedIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleThumbClick = (idx: number) => {
    setSelectedIndex(idx);
    const img = allImages[idx];
    if (img.variantId && onVariantSelect) {
      onVariantSelect(img.variantId);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main display with carousel controls */}
      <div
        className="relative group aspect-square rounded-2xl overflow-hidden bg-white border border-border/30 shadow-sm cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleZoomMove}
      >
        {currentImage.url ? (
          <div className="w-full h-full overflow-hidden">
            <OptimizedImage
              src={currentImage.url}
              alt={title}
              className={cn(
                'w-full h-full object-contain p-4 transition-transform duration-300',
                isZoomed && 'scale-[2]'
              )}
              wrapperClassName="w-full h-full"
              sizes="(min-width: 768px) 50vw, 100vw"
              style={isZoomed ? {
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
              } : undefined}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {title}
          </div>
        )}

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}

        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {safeIndex + 1} / {allImages.length}
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
          <ZoomIn className="h-5 w-5 text-foreground" />
        </div>
      </div>

      {/* Thumbnail strip with variant indicators */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {allImages.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              onClick={() => handleThumbClick(idx)}
              className={cn(
                'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative group/thumb',
                safeIndex === idx
                  ? 'border-[hsl(var(--sm-gold))] ring-1 ring-[hsl(var(--sm-gold))]/30 scale-105'
                  : 'border-border/30 hover:border-border hover:scale-105'
              )}
              title={img.label}
            >
              <img
                src={thumbUrl(img.url)}
                alt={img.label || `${title} view ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={64}
                height={64}
              />
              {/* Color dot indicator */}
              {img.colorHex && (
                <span
                  className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: img.colorHex }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
