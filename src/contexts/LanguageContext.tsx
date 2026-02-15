import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'bn' | 'en';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Nav
  'nav.home': { en: 'Home', bn: 'হোম' },
  'nav.about': { en: 'About', bn: 'আমাদের সম্পর্কে' },
  'nav.services': { en: 'Services', bn: 'সেবাসমূহ' },
  'nav.products': { en: 'Products', bn: 'পণ্যসমূহ' },
  'nav.contact': { en: 'Contact', bn: 'যোগাযোগ' },
  // Hero
  'hero.title': { en: 'Your Trusted Partner for Customized Corporate Gifts', bn: 'কাস্টমাইজড কর্পোরেট গিফটের আপনার বিশ্বস্ত অংশীদার' },
  'hero.subtitle': { en: 'Premium promotional products with your brand identity for government & private organizations', bn: 'সরকারি ও বেসরকারি প্রতিষ্ঠানের জন্য আপনার ব্র্যান্ড পরিচয়ে প্রিমিয়াম প্রমোশনাল পণ্য' },
  'hero.cta': { en: 'Get a Quote', bn: 'কোটেশন নিন' },
  'hero.contact': { en: 'Contact Us', bn: 'যোগাযোগ করুন' },
  // About
  'about.title': { en: 'About Us', bn: 'আমাদের সম্পর্কে' },
  'about.desc': { en: 'S.M. Trade International is a leading trading company specializing in customized promotional and corporate gift items. We serve both government and private sector organizations, delivering high-quality branded products with precision and care.', bn: 'এস.এম. ট্রেড ইন্টারন্যাশনাল একটি শীর্ষস্থানীয় ট্রেডিং কোম্পানি যা কাস্টমাইজড প্রমোশনাল ও কর্পোরেট গিফট আইটেমে বিশেষজ্ঞ। আমরা সরকারি ও বেসরকারি উভয় প্রতিষ্ঠানে সেবা প্রদান করি, নির্ভুলতা ও যত্নের সাথে উচ্চমানের ব্র্যান্ডেড পণ্য সরবরাহ করি।' },
  'about.stat1.label': { en: 'Years Experience', bn: 'বছরের অভিজ্ঞতা' },
  'about.stat2.label': { en: 'Happy Clients', bn: 'সন্তুষ্ট ক্লায়েন্ট' },
  'about.stat3.label': { en: 'Products Delivered', bn: 'পণ্য সরবরাহ' },
  'about.stat4.label': { en: 'Categories', bn: 'ক্যাটাগরি' },
  // Services
  'services.title': { en: 'Our Services', bn: 'আমাদের সেবাসমূহ' },
  'services.1.title': { en: 'Corporate Gift Customization', bn: 'কর্পোরেট গিফট কাস্টমাইজেশন' },
  'services.1.desc': { en: 'Custom-made gifts tailored to your brand identity and corporate needs.', bn: 'আপনার ব্র্যান্ড পরিচয় ও কর্পোরেট চাহিদা অনুযায়ী কাস্টম-মেইড গিফট।' },
  'services.2.title': { en: 'Logo & Brand Printing', bn: 'লোগো ও ব্র্যান্ড প্রিন্টিং' },
  'services.2.desc': { en: 'High-quality logo printing and branding on all products.', bn: 'সকল পণ্যে উচ্চমানের লোগো প্রিন্টিং ও ব্র্যান্ডিং।' },
  'services.3.title': { en: 'Bulk Order & Delivery', bn: 'বাল্ক অর্ডার ও ডেলিভারি' },
  'services.3.desc': { en: 'Large quantity orders with timely delivery across Bangladesh.', bn: 'সারা বাংলাদেশে সময়মতো ডেলিভারিসহ বড় পরিমাণের অর্ডার।' },
  'services.4.title': { en: 'Custom Packaging', bn: 'কাস্টম প্যাকেজিং' },
  'services.4.desc': { en: 'Premium packaging solutions to enhance your gift presentation.', bn: 'আপনার গিফট উপস্থাপনা উন্নত করতে প্রিমিয়াম প্যাকেজিং সমাধান।' },
  // Products
  'products.title': { en: 'Our Products', bn: 'আমাদের পণ্যসমূহ' },
  'products.all': { en: 'All', bn: 'সব' },
  'products.corporate': { en: 'Corporate', bn: 'কর্পোরেট' },
  'products.souvenir': { en: 'Souvenir', bn: 'স্মারক' },
  'products.stationery': { en: 'Stationery', bn: 'স্টেশনারি' },
  // Clients
  'clients.title': { en: 'Our Trusted Clients', bn: 'আমাদের বিশ্বস্ত ক্লায়েন্ট' },
  'clients.subtitle': { en: 'We are proud to have served prestigious government and private organizations', bn: 'আমরা গর্বের সাথে বিভিন্ন সরকারি ও বেসরকারি প্রতিষ্ঠানে সেবা প্রদান করেছি' },
  // Contact
  'contact.title': { en: 'Contact Us', bn: 'যোগাযোগ করুন' },
  'contact.name': { en: 'Your Name', bn: 'আপনার নাম' },
  'contact.email': { en: 'Your Email', bn: 'আপনার ইমেইল' },
  'contact.phone': { en: 'Your Phone', bn: 'আপনার ফোন' },
  'contact.message': { en: 'Your Message', bn: 'আপনার মেসেজ' },
  'contact.send': { en: 'Send Message', bn: 'মেসেজ পাঠান' },
  'contact.whatsapp': { en: 'Chat on WhatsApp', bn: 'WhatsApp এ চ্যাট করুন' },
  'contact.address': { en: 'Address', bn: 'ঠিকানা' },
  'contact.addressValue': { en: 'Dhaka, Bangladesh', bn: 'ঢাকা, বাংলাদেশ' },
  // Footer
  'footer.rights': { en: 'All rights reserved.', bn: 'সর্বস্বত্ব সংরক্ষিত।' },
  'footer.desc': { en: 'Your trusted partner for customized corporate gifts & promotional products.', bn: 'কাস্টমাইজড কর্পোরেট গিফট ও প্রমোশনাল পণ্যের আপনার বিশ্বস্ত অংশীদার।' },
  'footer.quicklinks': { en: 'Quick Links', bn: 'দ্রুত লিংক' },
  'footer.contactinfo': { en: 'Contact Info', bn: 'যোগাযোগ তথ্য' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');
  const toggleLang = () => setLang(l => l === 'en' ? 'bn' : 'en');
  const t = (key: string) => translations[key]?.[lang] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
