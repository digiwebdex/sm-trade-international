import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuoteBasket } from '@/contexts/QuoteBasketContext';
import {
  ArrowLeft, ShoppingBag, MessageCircle, Share2,
  ChevronRight, Minus, Plus, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import ProductImageGallery, { TypedImage } from '@/components/product/ProductImageGallery';
import OptimizedImage from '@/components/OptimizedImage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isUUID, productSlug } from '@/lib/productSlug';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { addItem } = useQuoteBasket();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) return null;
      if (isUUID(id)) {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name_en, name_bn)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data: byCode } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('product_code', decodeURIComponent(id))
        .maybeSingle();
      if (byCode) return byCode;
      const { data: all } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)');
      const slug = decodeURIComponent(id);
      return all?.find(p => {
        const s = p.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return s === slug;
      }) || null;
    },
    enabled: !!id,
  });

  const productId = product?.id;

  const { data: productImages = [] } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('category_id', product!.category_id!)
        .neq('id', productId!)
        .eq('is_active', true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  // Build gallery images - if a variant is selected, show its image first
  const galleryImages = useMemo((): TypedImage[] => {
    const result: TypedImage[] = [];
    const seen = new Set<string>();
    const add = (img: TypedImage) => {
      if (!img.url || seen.has(img.url)) return;
      seen.add(img.url);
      result.push(img);
    };

    // If a variant is selected and has an image, show it first
    if (selectedVariantId) {
      const sv = variants.find((v: any) => v.id === selectedVariantId);
      if (sv?.image_url) {
        add({ id: sv.id, url: sv.image_url, image_type: 'main', variant_id: sv.id });
      }
    }

    (productImages as any[]).forEach(img => add({
      id: img.id, url: img.image_url, image_type: img.image_type ?? 'main', variant_id: null,
    }));
    if (product?.image_url) {
      add({ url: product.image_url, image_type: 'main' });
    }
    return result;
  }, [productImages, product, selectedVariantId, variants]);

  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId);
  const unitPrice = Number(selectedVariant?.unit_price || (product as any)?.unit_price) || 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToQuote = () => {
    if (!product) return;
    const displayImg = galleryImages[0]?.url ?? '';
    addItem({
      id: product.id,
      titleEn: product.name_en,
      titleBn: product.name_bn || '',
      src: displayImg,
      category: product.category_id || '',
    });
    toast.success(lang === 'en' ? 'Added to quote basket' : 'কোটেশন বাস্কেটে যোগ হয়েছে');
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const msg = encodeURIComponent(
      `Hi, I'm interested in: ${product.name_en}, Qty: ${quantity}. Please share price & availability.`
    );
    window.open(`https://wa.me/8801867666888?text=${msg}`, '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product?.name_en ?? '', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(lang === 'en' ? 'Link copied!' : 'লিংক কপি হয়েছে!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Skeleton className="h-4 w-48 mb-4" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang === 'en' ? 'Product not found' : 'পণ্য পাওয়া যায়নি'}</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {lang === 'en' ? 'Go Back' : 'ফিরে যান'}
          </Button>
        </div>
      </div>
    );
  }

  const cat = (product as any).categories;
  const title = lang === 'en' ? product.name_en : (product.name_bn || product.name_en);
  const desc = lang === 'en' ? (product.description_en ?? '') : (product.description_bn ?? product.description_en ?? '');
  const shortDesc = lang === 'en'
    ? ((product as any).short_description_en ?? '')
    : ((product as any).short_description_bn ?? (product as any).short_description_en ?? '');
  const categoryLabel = cat ? (lang === 'en' ? cat.name_en : (cat.name_bn || cat.name_en)) : '';

  return (
    <div className="min-h-screen bg-background pt-2 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate(-1)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {lang === 'en' ? 'Back' : 'ফিরুন'}
          </button>
          <span className="text-border">|</span>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-accent hover:underline transition-colors">{lang === 'en' ? 'Home' : 'হোম'}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/products" className="hover:text-accent hover:underline transition-colors">{lang === 'en' ? 'Products' : 'পণ্য'}</Link>
            {categoryLabel && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link to={`/catalog?category=${product.category_id}`} className="hover:text-accent hover:underline transition-colors">{categoryLabel}</Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate max-w-[200px]">{title}</span>
          </nav>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* LEFT — Image Gallery */}
          <div className="lg:sticky lg:top-20">
            <ProductImageGallery
              images={galleryImages}
              selectedVariantId={null}
              title={title}
            />
          </div>

          {/* RIGHT — Product Info */}
          <div className="flex flex-col gap-4">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-snug">
              {title}
            </h1>

            {categoryLabel && (
              <Link to={`/catalog?category=${product.category_id}`}
                className="text-sm text-accent hover:text-accent/80 hover:underline w-fit">
                {lang === 'en' ? `Visit the ${categoryLabel} Store` : `${categoryLabel} স্টোর দেখুন`}
              </Link>
            )}

            {shortDesc && (
              <p className="text-sm text-muted-foreground">{shortDesc}</p>
            )}
            {product.unit_price > 0 && (
              <p className="text-2xl font-bold text-foreground">
                ৳{product.unit_price.toLocaleString()}
              </p>
            )}

            {/* Color Variants */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {lang === 'en' ? 'Color' : 'রঙ'}:{' '}
                  <span className="font-bold">
                    {selectedVariant
                      ? (selectedVariant.color_name || selectedVariant.variant_label_en)
                      : (lang === 'en' ? 'Select a color' : 'একটি রঙ নির্বাচন করুন')}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {variants.map((v: any) => (
                    <button
                      key={v.id}
                      type="button"
                      onMouseEnter={() => setSelectedVariantId(v.id)}
                      onClick={() => setSelectedVariantId(v.id === selectedVariantId ? null : v.id)}
                      className={cn(
                        'relative w-[104px] h-[104px] rounded-lg border-2 overflow-hidden transition-all bg-white',
                        selectedVariantId === v.id
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border/50 hover:border-foreground/40'
                      )}
                      title={v.color_name || v.variant_label_en}
                    >
                      {v.image_url ? (
                        <img src={v.image_url} alt={v.color_name || v.variant_label_en} className="w-full h-full object-cover" />
                      ) : v.color_hex ? (
                        <div className="w-full h-full" style={{ backgroundColor: v.color_hex }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          {v.variant_label_en?.slice(0, 3)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-border/50" />


            {/* Product Code */}
            {(product as any).product_code && (
              <div className="text-xs text-muted-foreground">
                {lang === 'en' ? 'Product Code' : 'পণ্য কোড'}: <span className="font-mono font-semibold text-foreground">{(product as any).product_code}</span>
              </div>
            )}

            <div className="h-px bg-border/50" />

            {/* Description */}
            {desc && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">{lang === 'en' ? 'About this item' : 'এই পণ্য সম্পর্কে'}</h3>
                <ul className="space-y-1.5 text-sm text-foreground/90 leading-relaxed">
                  {desc.split(/[.।]\s*/).filter(Boolean).map((sentence, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                      <span>{sentence.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Highlights */}
            <div className="space-y-1.5">
              {[
                lang === 'en' ? 'Custom branding & logo engraving available' : 'কাস্টম ব্র্যান্ডিং ও লোগো খোদাই উপলব্ধ',
                lang === 'en' ? 'Premium quality materials & craftsmanship' : 'প্রিমিয়াম মানের উপকরণ ও কারুশিল্প',
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))] shrink-0" />
                  {h}
                </div>
              ))}
            </div>

            <div className="h-px bg-border/50" />

            {/* Buy Box */}
            <div className="rounded-lg border border-border/50 p-4 space-y-3 bg-card">
              <div className="text-lg font-medium text-green-600">
                {lang === 'en' ? 'In stock' : 'স্টকে আছে'}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{lang === 'en' ? 'Quantity' : 'পরিমাণ'}:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors border-r border-border">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <Input type="number" min={1} value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center border-0 rounded-none h-8 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm" />
                  <button onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors border-l border-border">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <Button onClick={handleAddToQuote}
                className="w-full bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold))]/90 text-white gap-2 rounded-full h-10">
                <ShoppingBag className="h-4 w-4" />
                {lang === 'en' ? 'Add to Quote Basket' : 'কোটেশন বাস্কেটে যোগ করুন'}
              </Button>
              <Button onClick={handleWhatsApp}
                className="w-full bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white gap-2 rounded-full h-10">
                <MessageCircle className="h-4 w-4" />
                {lang === 'en' ? 'Order via WhatsApp' : 'WhatsApp এ অর্ডার করুন'}
              </Button>

              <button onClick={handleShare} className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                <Share2 className="h-3.5 w-3.5" />
                {lang === 'en' ? 'Share' : 'শেয়ার'}
              </button>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">
              {lang === 'en' ? 'Related Products' : 'সম্পর্কিত পণ্য'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp: any) => {
                const rpCat = rp.categories;
                const rpTitle = lang === 'en' ? rp.name_en : (rp.name_bn || rp.name_en);
                const rpPrice = Number(rp.unit_price) || 0;
                return (
                  <Link key={rp.id} to={`/product/${productSlug(rp)}`}
                    className="group rounded-lg overflow-hidden bg-background border border-border/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="aspect-square overflow-hidden bg-white">
                      {rp.image_url ? (
                        <OptimizedImage src={rp.image_url} alt={rpTitle}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          wrapperClassName="w-full h-full" sizes="(min-width: 768px) 25vw, 50vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{rpTitle}</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2">{rpTitle}</h3>
                      {rpPrice > 0 && (
                        <p className="text-sm font-bold text-foreground mt-1">৳{rpPrice.toLocaleString()}</p>
                      )}
                      {rpCat && (
                        <span className="text-[10px] text-muted-foreground">
                          {lang === 'en' ? rpCat.name_en : (rpCat.name_bn || rpCat.name_en)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
