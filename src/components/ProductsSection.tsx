import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

import img1 from '@/assets/products/ties-blue.png';
import img2 from '@/assets/products/bpatc-building.png';
import img3 from '@/assets/products/product-3.png';
import img4 from '@/assets/products/product-4.png';
import img5 from '@/assets/products/product-5.png';
import img6 from '@/assets/products/tunnel-souvenir.png';
import img7 from '@/assets/products/product-7.png';
import img8 from '@/assets/products/product-8.png';
import img9 from '@/assets/products/product-9.png';
import img10 from '@/assets/products/product-10.png';
import img11 from '@/assets/products/glassware.png';
import img12 from '@/assets/products/product-12.png';

interface Product {
  src: string;
  titleEn: string;
  titleBn: string;
  category: string;
}

const products: Product[] = [
  { src: img1, titleEn: 'Customized Ties', titleBn: 'কাস্টমাইজড টাই', category: 'corporate' },
  { src: img2, titleEn: 'BPATC Project', titleBn: 'বিপিএটিসি প্রজেক্ট', category: 'souvenir' },
  { src: img3, titleEn: 'Leather Goods', titleBn: 'লেদার পণ্য', category: 'corporate' },
  { src: img4, titleEn: 'Custom Bags', titleBn: 'কাস্টম ব্যাগ', category: 'corporate' },
  { src: img5, titleEn: 'Promotional Items', titleBn: 'প্রমোশনাল আইটেম', category: 'corporate' },
  { src: img6, titleEn: 'Bangabandhu Tunnel Souvenir', titleBn: 'বঙ্গবন্ধু টানেল স্মারক', category: 'souvenir' },
  { src: img7, titleEn: 'Custom Products', titleBn: 'কাস্টম পণ্য', category: 'corporate' },
  { src: img8, titleEn: 'Branded Items', titleBn: 'ব্র্যান্ডেড আইটেম', category: 'corporate' },
  { src: img9, titleEn: 'Stationery Set', titleBn: 'স্টেশনারি সেট', category: 'stationery' },
  { src: img10, titleEn: 'Premium Gifts', titleBn: 'প্রিমিয়াম গিফট', category: 'corporate' },
  { src: img11, titleEn: 'Deli Glassware', titleBn: 'ডেলি গ্লাসওয়্যার', category: 'corporate' },
  { src: img12, titleEn: 'Special Collection', titleBn: 'স্পেশাল কালেকশন', category: 'corporate' },
];

const ProductsSection = () => {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const categories = ['all', 'corporate', 'souvenir', 'stationery'];
  const catKeys: Record<string, string> = { all: 'products.all', corporate: 'products.corporate', souvenir: 'products.souvenir', stationery: 'products.stationery' };
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

  return (
    <section id="products" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('products.title')}</h2>
        <div className="w-16 h-1 bg-sm-red mx-auto mb-8 rounded" />

        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${filter === c ? 'bg-sm-red text-white' : 'bg-background text-foreground hover:bg-accent'}`}
            >
              {t(catKeys[c])}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <div
              key={i}
              className="group cursor-pointer overflow-hidden rounded-xl bg-background shadow-sm hover:shadow-lg transition-all"
              onClick={() => setLightbox(p.src)}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={p.src}
                  alt={lang === 'en' ? p.titleEn : p.titleBn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-center">{lang === 'en' ? p.titleEn : p.titleBn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightbox} alt="Product" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}
    </section>
  );
};

export default ProductsSection;
