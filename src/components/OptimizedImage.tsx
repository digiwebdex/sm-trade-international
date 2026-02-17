import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  /** The image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Responsive size hints (default: "100vw") */
  sizes?: string;
  /** Additional className */
  className?: string;
  /** Container className for the wrapper div */
  wrapperClassName?: string;
  /** Whether to show a blur-up placeholder */
  blurPlaceholder?: boolean;
  /** Priority loading — disables lazy load */
  priority?: boolean;
}

/**
 * Generates srcSet for Supabase Storage images using the transform API.
 * For local/static imports, returns undefined (Vite handles those).
 */
function buildSrcSet(src: string): string | undefined {
  // Only generate srcSet for Supabase storage URLs
  if (!src.includes('supabase.co/storage')) return undefined;

  const widths = [320, 480, 640, 960, 1280];
  return widths
    .map(w => {
      const url = new URL(src);
      url.searchParams.set('width', String(w));
      url.searchParams.set('quality', '80');
      return `${url.toString()} ${w}w`;
    })
    .join(', ');
}

/**
 * Generates a WebP variant URL for Supabase storage images.
 */
function buildWebPSrc(src: string): string | undefined {
  if (!src.includes('supabase.co/storage')) return undefined;
  const url = new URL(src);
  url.searchParams.set('format', 'webp');
  url.searchParams.set('quality', '80');
  return url.toString();
}

const OptimizedImage = ({
  src,
  alt,
  sizes = '100vw',
  className,
  wrapperClassName,
  blurPlaceholder = true,
  priority = false,
  ...rest
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for true lazy loading with early trigger
  useEffect(() => {
    if (priority || inView) return;
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // start loading 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  const srcSet = buildSrcSet(src);
  const webpSrc = buildWebPSrc(src);

  return (
    <div ref={imgRef} className={cn('overflow-hidden', wrapperClassName)}>
      {inView && (
        <picture>
          {/* WebP source for Supabase images */}
          {webpSrc && srcSet && (
            <source
              type="image/webp"
              srcSet={srcSet.replace(/supabase\.co\/storage\/v1\/object\/public/g, (match) => match)
                .split(', ')
                .map(entry => {
                  const [url, w] = entry.split(' ');
                  const webpUrl = new URL(url);
                  webpUrl.searchParams.set('format', 'webp');
                  return `${webpUrl.toString()} ${w}`;
                })
                .join(', ')
              }
              sizes={sizes}
            />
          )}
          {/* Original format with srcSet */}
          {srcSet && (
            <source srcSet={srcSet} sizes={sizes} />
          )}
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : undefined}
            onLoad={() => setLoaded(true)}
            className={cn(
              'transition-all duration-500',
              blurPlaceholder && !loaded && 'scale-105 blur-sm',
              blurPlaceholder && loaded && 'scale-100 blur-0',
              className
            )}
            {...rest}
          />
        </picture>
      )}
      {/* Skeleton placeholder while not loaded */}
      {!loaded && blurPlaceholder && (
        <Skeleton
          className={cn(
            'absolute inset-0 rounded-none',
            loaded && 'opacity-0 transition-opacity duration-300'
          )}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
