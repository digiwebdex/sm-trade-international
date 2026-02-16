import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MessageCircle, Palette, Image, Package, Send, RotateCcw, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TopBar from '@/components/TopBar';
import Navbar from '@/components/Navbar';
import { lazy, Suspense } from 'react';

const Footer = lazy(() => import('@/components/Footer'));

// Product templates
import img1 from '@/assets/products/ties-blue.png';
import img3 from '@/assets/products/product-3.png';
import img5 from '@/assets/products/product-5.png';
import img8 from '@/assets/products/product-8.png';
import img9 from '@/assets/products/product-9.png';
import img11 from '@/assets/products/glassware.png';

interface ProductTemplate {
  id: string;
  nameEn: string;
  nameBn: string;
  image: string;
  logoPositions: string[];
}

const productTemplates: ProductTemplate[] = [
  { id: 'trophy', nameEn: 'Crystal Trophy', nameBn: 'ক্রিস্টাল ট্রফি', image: img3, logoPositions: ['Center||সেন্টার', 'Base||বেস'] },
  { id: 'tie', nameEn: 'Silk Tie', nameBn: 'সিল্ক টাই', image: img1, logoPositions: ['Bottom tip||নিচের প্রান্ত', 'Label||লেবেল'] },
  { id: 'pen', nameEn: 'Executive Pen Set', nameBn: 'এক্সিকিউটিভ পেন সেট', image: img5, logoPositions: ['Barrel||ব্যারেল', 'Clip||ক্লিপ', 'Cap||ক্যাপ'] },
  { id: 'thermos', nameEn: 'Insulated Thermos', nameBn: 'ইনসুলেটেড থার্মোস', image: img8, logoPositions: ['Front||সামনে', 'Back||পিছনে', 'Cap||ক্যাপ'] },
  { id: 'portfolio', nameEn: 'Leather Portfolio', nameBn: 'লেদার পোর্টফোলিও', image: img9, logoPositions: ['Front cover||সামনের কভার', 'Inside flap||ভিতরের ফ্ল্যাপ', 'Spine||স্পাইন'] },
  { id: 'glassware', nameEn: 'Custom Glassware', nameBn: 'কাস্টম গ্লাসওয়্যার', image: img11, logoPositions: ['Body||বডি', 'Base||বেস'] },
];

const colorOptions = [
  { id: 'navy', nameEn: 'Navy Blue', nameBn: 'নেভি ব্লু', hex: '#1a365d' },
  { id: 'black', nameEn: 'Classic Black', nameBn: 'ক্লাসিক ব্ল্যাক', hex: '#1a1a2e' },
  { id: 'burgundy', nameEn: 'Burgundy', nameBn: 'বারগান্ডি', hex: '#722f37' },
  { id: 'gold', nameEn: 'Royal Gold', nameBn: 'রয়্যাল গোল্ড', hex: '#b8860b' },
  { id: 'silver', nameEn: 'Platinum Silver', nameBn: 'প্লাটিনাম সিলভার', hex: '#8c8c8c' },
  { id: 'green', nameEn: 'Forest Green', nameBn: 'ফরেস্ট গ্রিন', hex: '#2d5a27' },
  { id: 'white', nameEn: 'Pearl White', nameBn: 'পার্ল হোয়াইট', hex: '#f5f5f0' },
  { id: 'brown', nameEn: 'Cognac Brown', nameBn: 'কগন্যাক ব্রাউন', hex: '#6b3a2a' },
];

const packagingOptions = [
  { id: 'standard', nameEn: 'Standard Box', nameBn: 'স্ট্যান্ডার্ড বক্স', icon: '📦' },
  { id: 'premium', nameEn: 'Premium Gift Box', nameBn: 'প্রিমিয়াম গিফট বক্স', icon: '🎁' },
  { id: 'luxury', nameEn: 'Luxury Leather Case', nameBn: 'লাক্সারি লেদার কেস', icon: '👜' },
  { id: 'hamper', nameEn: 'Gift Hamper Basket', nameBn: 'গিফট হ্যাম্পার বাস্কেট', icon: '🧺' },
];

const quantityTiers = [
  { min: 1, max: 49, labelEn: '1–49 pcs', labelBn: '১–৪৯টি' },
  { min: 50, max: 199, labelEn: '50–199 pcs', labelBn: '৫০–১৯৯টি' },
  { min: 200, max: 499, labelEn: '200–499 pcs', labelBn: '২০০–৪৯৯টি' },
  { min: 500, max: 99999, labelEn: '500+ pcs', labelBn: '৫০০+ টি' },
];

const GiftConfigurator = () => {
  const { lang } = useLanguage();
  const { get } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const whatsappNumber = (get('contact', 'whatsapp_number', '8801867666888') as string).replace(/[^0-9]/g, '') || '8801867666888';

  // Initialize state from URL params or defaults
  const paramProduct = searchParams.get('product');
  const paramColor = searchParams.get('color');
  const paramLogo = searchParams.get('logo');
  const paramPkg = searchParams.get('pkg');
  const paramQty = searchParams.get('qty');
  const paramCompany = searchParams.get('company');
  const paramNotes = searchParams.get('notes');

  const [selectedProduct, setSelectedProduct] = useState<string>(
    productTemplates.some(p => p.id === paramProduct) ? paramProduct! : 'trophy'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    colorOptions.some(c => c.id === paramColor) ? paramColor! : 'navy'
  );
  const [logoPosition, setLogoPosition] = useState<string>(paramLogo || '');
  const [packaging, setPackaging] = useState<string>(
    packagingOptions.some(p => p.id === paramPkg) ? paramPkg! : 'premium'
  );
  const [quantity, setQuantity] = useState<string>(paramQty || '50-199');
  const [companyName, setCompanyName] = useState(paramCompany || '');
  const [notes, setNotes] = useState(paramNotes || '');
  const [linkCopied, setLinkCopied] = useState(false);

  const product = productTemplates.find(p => p.id === selectedProduct)!;
  const color = colorOptions.find(c => c.id === selectedColor)!;
  const pkg = packagingOptions.find(p => p.id === packaging)!;
  const colorName = lang === 'en' ? color.nameEn : color.nameBn;

  // Helper to get bilingual logo position label
  const posLabel = (pos: string) => {
    const parts = pos.split('||');
    return lang === 'en' ? parts[0] : (parts[1] || parts[0]);
  };
  const posEn = (pos: string) => pos.split('||')[0];

  // Set default logo position when product changes
  const positions = product.logoPositions;
  const activeLogoPos = positions.includes(logoPosition) ? logoPosition : positions[0];

  const summaryText = useMemo(() => {
    const productName = lang === 'en' ? product.nameEn : product.nameBn;
    const pkgName = lang === 'en' ? pkg.nameEn : pkg.nameBn;
    if (lang === 'en') {
      return `${productName} in ${colorName}, logo on ${posLabel(activeLogoPos)}, ${pkgName} packaging${companyName ? ` for ${companyName}` : ''}`;
    }
    return `${productName} — ${colorName} রঙে, লোগো ${posLabel(activeLogoPos)} এ, ${pkgName} প্যাকেজিং${companyName ? ` — ${companyName} এর জন্য` : ''}`;
  }, [product, color, activeLogoPos, pkg, companyName, lang, colorName]);

  const whatsappUrl = useMemo(() => {
    const msg = lang === 'en'
      ? `Hi, I'd like to configure a custom gift:\n\n🎁 Product: ${product.nameEn}\n🎨 Color: ${color.nameEn}\n📍 Logo: ${posEn(activeLogoPos)}\n📦 Packaging: ${pkg.nameEn}\n📊 Quantity: ${quantity}\n🏢 Company: ${companyName || 'N/A'}\n📝 Notes: ${notes || 'None'}\n\nPlease share pricing & timeline.`
      : `হ্যালো, আমি একটি কাস্টম গিফট কনফিগার করতে চাই:\n\n🎁 পণ্য: ${product.nameBn}\n🎨 রঙ: ${color.nameBn}\n📍 লোগো: ${posLabel(activeLogoPos)}\n📦 প্যাকেজিং: ${pkg.nameBn}\n📊 পরিমাণ: ${quantity}\n🏢 কোম্পানি: ${companyName || 'N/A'}\n📝 নোট: ${notes || 'নেই'}\n\nদয়া করে মূল্য ও সময়সীমা জানান।`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }, [product, color, activeLogoPos, pkg, quantity, companyName, notes, lang, whatsappNumber]);

  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('product', selectedProduct);
    params.set('color', selectedColor);
    if (activeLogoPos) params.set('logo', activeLogoPos);
    params.set('pkg', packaging);
    params.set('qty', quantity);
    if (companyName) params.set('company', companyName);
    if (notes) params.set('notes', notes);
    return `${window.location.origin}/configurator?${params.toString()}`;
  }, [selectedProduct, selectedColor, activeLogoPos, packaging, quantity, companyName, notes]);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = getShareableUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [getShareableUrl]);

  const reset = () => {
    setSelectedProduct('trophy');
    setSelectedColor('navy');
    setLogoPosition('');
    setPackaging('premium');
    setQuantity('50-199');
    setCompanyName('');
    setNotes('');
    // Clear URL params
    window.history.replaceState({}, '', '/configurator');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, hsl(var(--sm-gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--sm-gold)) 0%, transparent 50%)',
        }} />
        <div className="container mx-auto px-4 relative text-center">
          <span className="inline-block text-accent text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Interactive Tool' : 'ইন্টারেক্টিভ টুল'}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {lang === 'en' ? 'Gift Configurator' : 'গিফট কনফিগারেটর'}
          </h1>
          <p className="text-primary-foreground/60 max-w-lg mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en'
              ? 'Design your perfect corporate gift — choose product, colors, logo placement & packaging.'
              : 'আপনার পারফেক্ট কর্পোরেট গিফট ডিজাইন করুন — পণ্য, রঙ, লোগো ও প্যাকেজিং নির্বাচন করুন।'}
          </p>
        </div>
      </section>

      {/* Configurator */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8">

            {/* Left: Options (3 cols) */}
            <div className="lg:col-span-3 space-y-8">

              {/* Step 1: Product */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">1</span>
                  {lang === 'en' ? 'Choose Product' : 'পণ্য নির্বাচন করুন'}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {productTemplates.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p.id)}
                      className={`rounded-xl border-2 p-2 transition-all duration-200 ${
                        selectedProduct === p.id
                          ? 'border-accent shadow-lg scale-105 bg-accent/5'
                          : 'border-border hover:border-accent/40 bg-card'
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-white mb-1.5">
                        <img src={p.image} alt={lang === 'en' ? p.nameEn : p.nameBn} className="w-full h-full object-contain p-1" />
                      </div>
                      <p className="text-[10px] font-medium text-center leading-tight line-clamp-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {lang === 'en' ? p.nameEn : p.nameBn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Color */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">2</span>
                  <Palette className="h-4 w-4" />
                  {lang === 'en' ? 'Select Color' : 'রঙ নির্বাচন করুন'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 ${
                        selectedColor === c.id
                          ? 'border-accent bg-accent/5 shadow-sm'
                          : 'border-border hover:border-accent/40'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border border-border/50 shrink-0 ${selectedColor === c.id ? 'ring-2 ring-accent ring-offset-1' : ''}`}
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>{lang === 'en' ? c.nameEn : c.nameBn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Logo Position */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">3</span>
                  <Image className="h-4 w-4" />
                  {lang === 'en' ? 'Logo Placement' : 'লোগো প্লেসমেন্ট'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {positions.map(pos => (
                    <button
                      key={pos}
                      onClick={() => setLogoPosition(pos)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeLogoPos === pos
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-foreground hover:bg-accent/10'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {posLabel(pos)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Packaging */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">4</span>
                  <Package className="h-4 w-4" />
                  {lang === 'en' ? 'Packaging' : 'প্যাকেজিং'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {packagingOptions.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPackaging(p.id)}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                        packaging === p.id
                          ? 'border-accent bg-accent/5 shadow-sm'
                          : 'border-border hover:border-accent/40 bg-card'
                      }`}
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <span className="text-xs font-medium text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {lang === 'en' ? p.nameEn : p.nameBn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 5: Quantity */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">5</span>
                  {lang === 'en' ? 'Quantity Range' : 'পরিমাণ'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quantityTiers.map(tier => {
                    const val = `${tier.min}-${tier.max}`;
                    return (
                      <button
                        key={val}
                        onClick={() => setQuantity(val)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          quantity === val
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary text-foreground hover:bg-accent/10'
                        }`}
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {lang === 'en' ? tier.labelEn : tier.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional: Company & Notes */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {lang === 'en' ? 'Company Name' : 'কোম্পানির নাম'}
                  </label>
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder={lang === 'en' ? 'Your company name' : 'আপনার কোম্পানির নাম'}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {lang === 'en' ? 'Special Notes' : 'বিশেষ নোট'}
                  </label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={lang === 'en' ? 'Any special requirements...' : 'বিশেষ প্রয়োজনীয়তা...'}
                    rows={2}
                    maxLength={500}
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Preview (2 cols) */}
            <div className="lg:col-span-2">
              <div className="sticky top-20">
                {/* Preview Card */}
                <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                  {/* Product image with color overlay */}
                  <div className="relative aspect-square bg-white">
                    <img
                      src={product.image}
                      alt={lang === 'en' ? product.nameEn : product.nameBn}
                      className="w-full h-full object-contain p-8"
                    />
                    {/* Color tint overlay */}
                    <div
                      className="absolute inset-0 mix-blend-multiply opacity-15 transition-colors duration-500"
                      style={{ backgroundColor: color.hex }}
                    />
                    {/* Logo position indicator */}
                    <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {lang === 'en' ? 'Logo' : 'লোগো'}: {posLabel(activeLogoPos)}
                    </div>
                    {/* Color swatch */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex }} />
                      <span className="text-[11px] font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>{colorName}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                        {lang === 'en' ? product.nameEn : product.nameBn}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {summaryText}
                      </p>
                    </div>

                    {/* Config badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full">{colorName}</span>
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">{posLabel(activeLogoPos)}</span>
                      <span className="text-[10px] font-medium bg-secondary text-foreground px-2.5 py-1 rounded-full">{lang === 'en' ? pkg.nameEn : pkg.nameBn}</span>
                      <span className="text-[10px] font-medium bg-secondary text-foreground px-2.5 py-1 rounded-full">
                        {quantityTiers.find(t => `${t.min}-${t.max}` === quantity)?.[lang === 'en' ? 'labelEn' : 'labelBn']}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button asChild className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white w-full">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {lang === 'en' ? 'Send via WhatsApp' : 'WhatsApp এ পাঠান'}
                          </span>
                        </a>
                      </Button>
                      <Button asChild variant="default" className="w-full">
                        <a href="/#contact">
                          <Send className="h-4 w-4 mr-2" />
                          <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {lang === 'en' ? 'Request Formal Quote' : 'আনুষ্ঠানিক কোটেশন'}
                          </span>
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={copyShareLink}
                      >
                        {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
                        <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {linkCopied
                            ? (lang === 'en' ? 'Link Copied!' : 'লিংক কপি হয়েছে!')
                            : (lang === 'en' ? 'Share Configuration' : 'কনফিগারেশন শেয়ার করুন')}
                        </span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {lang === 'en' ? 'Reset' : 'রিসেট'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default GiftConfigurator;
