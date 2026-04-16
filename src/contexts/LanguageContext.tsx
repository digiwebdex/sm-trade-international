import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'bn' | 'en' | 'zh';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  /** Trilingual inline helper: tt('Hello','হ্যালো','你好') — picks by current lang with EN fallback. */
  tt: (en: string, bn: string, zh: string) => string;
}

const translations: Record<string, Partial<Record<Lang, string>>> = {
  // Nav
  'nav.home': { en: 'Home', bn: 'হোম', zh: '首页' },
  'nav.about': { en: 'About', bn: 'আমাদের সম্পর্কে', zh: '关于我们' },
  'nav.services': { en: 'Services', bn: 'সেবাসমূহ', zh: '服务' },
  'nav.products': { en: 'Products', bn: 'পণ্যসমূহ', zh: '产品' },
  'nav.contact': { en: 'Contact', bn: 'যোগাযোগ', zh: '联系我们' },
  'nav.catalog': { en: 'Catalog', bn: 'ক্যাটালগ', zh: '目录' },
  'nav.gallery': { en: 'Gallery', bn: 'গ্যালারি', zh: '画廊' },
  'nav.configurator': { en: 'Configure', bn: 'কনফিগার', zh: '配置' },
  'nav.3dpreview': { en: '3D Preview', bn: '3D প্রিভিউ', zh: '3D预览' },
  // Hero
  'hero.title': { en: 'Premium Customized Corporate Gifts & Promotional Products', bn: 'প্রিমিয়াম কাস্টমাইজড কর্পোরেট গিফট ও প্রমোশনাল পণ্য', zh: '优质定制企业礼品和促销产品' },
  'hero.subtitle': { en: 'We customize your brand identity with quality, precision and professionalism.', bn: 'আমরা আপনার ব্র্যান্ড পরিচয় মানসম্মতভাবে, নির্ভুলতার সাথে এবং পেশাদারিত্বের মাধ্যমে কাস্টমাইজ করি।', zh: '我们以高品质、精准和专业精神定制您的品牌形象。' },
  'hero.cta': { en: 'Get a Quote', bn: 'কোটেশন নিন', zh: '获取报价' },
  'hero.contact': { en: 'View Products', bn: 'পণ্য দেখুন', zh: '查看产品' },
  // About
  'about.title': { en: 'About Us', bn: 'আমাদের সম্পর্কে', zh: '关于我们' },
  'about.desc': { en: 'S. M. Trade International is a leading trading company specializing in customized promotional and corporate gift items. We serve both government and private sector organizations, delivering high-quality branded products with precision and care.', bn: 'এস. এম. ট্রেড ইন্টারন্যাশনাল একটি শীর্ষস্থানীয় ট্রেডিং কোম্পানি যা কাস্টমাইজড প্রমোশনাল ও কর্পোরেট গিফট আইটেমে বিশেষজ্ঞ। আমরা সরকারি ও বেসরকারি উভয় প্রতিষ্ঠানে সেবা প্রদান করি, নির্ভুলতা ও যত্নের সাথে উচ্চমানের ব্র্যান্ডেড পণ্য সরবরাহ করি।', zh: 'S. M. Trade International是一家领先的贸易公司，专注于定制促销和企业礼品。我们为政府和私营部门提供服务，以精确和细心交付高质量品牌产品。' },
  'about.stat1.label': { en: 'Years Experience', bn: 'বছরের অভিজ্ঞতা', zh: '年经验' },
  'about.stat2.label': { en: 'Happy Clients', bn: 'সন্তুষ্ট ক্লায়েন্ট', zh: '满意客户' },
  'about.stat3.label': { en: 'Products Delivered', bn: 'পণ্য সরবরাহ', zh: '已交付产品' },
  'about.stat4.label': { en: 'Categories', bn: 'ক্যাটাগরি', zh: '类别' },
  // Product Categories
  'categories.title': { en: 'Our Product Categories', bn: 'আমাদের পণ্য ক্যাটাগরি', zh: '我们的产品类别' },
  'categories.1.title': { en: 'Corporate Gift Items', bn: 'কর্পোরেট গিফট আইটেম', zh: '企业礼品' },
  'categories.1.desc': { en: 'Tie, Crystal, Pen, Key Ring and more — custom-branded for your organization.', bn: 'টাই, ক্রিস্টাল, কলম, কী-রিং এবং আরও অনেক কিছু — আপনার প্রতিষ্ঠানের ব্র্যান্ডে কাস্টমাইজড।', zh: '领带、水晶、钢笔、钥匙扣等——为您的组织定制品牌。' },
  'categories.2.title': { en: 'Office Accessories', bn: 'অফিস আনুষাঙ্গিক', zh: '办公配件' },
  'categories.2.desc': { en: 'Wooden Tissue Box, Desk Organizer, Pen Holder — elegant office essentials.', bn: 'কাঠের টিস্যু বক্স, ডেস্ক অর্গানাইজার, পেন হোল্ডার — মার্জিত অফিস সামগ্রী।', zh: '木质纸巾盒、桌面收纳盒、笔架——优雅的办公必需品。' },
  'categories.3.title': { en: 'Leather Products', bn: 'লেদার পণ্য', zh: '皮革产品' },
  'categories.3.desc': { en: 'Executive File, Document Folder — premium leather craftsmanship.', bn: 'এক্সিকিউটিভ ফাইল, ডকুমেন্ট ফোল্ডার — প্রিমিয়াম লেদার কারুশিল্প।', zh: '高管文件夹、文件袋——优质皮革工艺。' },
  'categories.4.title': { en: 'Customized Glass & Crystal', bn: 'কাস্টমাইজড গ্লাস ও ক্রিস্টাল', zh: '定制玻璃和水晶' },
  'categories.4.desc': { en: 'Award trophies, souvenirs and decorative crystal pieces with custom engraving.', bn: 'অ্যাওয়ার্ড ট্রফি, স্মারক ও কাস্টম খোদাই সহ সজ্জিত ক্রিস্টাল পিস।', zh: '奖杯、纪念品和定制雕刻装饰水晶件。' },
  // Customization Process
  'process.title': { en: 'Our Customization Process', bn: 'আমাদের কাস্টমাইজেশন প্রক্রিয়া', zh: '我们的定制流程' },
  'process.1.title': { en: 'Requirement Discussion', bn: 'চাহিদা আলোচনা', zh: '需求讨论' },
  'process.1.desc': { en: 'We understand your needs and brand guidelines.', bn: 'আমরা আপনার চাহিদা ও ব্র্যান্ড নির্দেশিকা বুঝি।', zh: '我们了解您的需求和品牌指南。' },
  'process.2.title': { en: 'Design Approval', bn: 'ডিজাইন অনুমোদন', zh: '设计审批' },
  'process.2.desc': { en: 'We share mockups for your review and approval.', bn: 'আমরা আপনার পর্যালোচনা ও অনুমোদনের জন্য মকআপ শেয়ার করি।', zh: '我们分享样稿供您审核和批准。' },
  'process.3.title': { en: 'Sample Production', bn: 'নমুনা উৎপাদন', zh: '样品生产' },
  'process.3.desc': { en: 'A sample is produced for quality check.', bn: 'মান যাচাইয়ের জন্য একটি নমুনা তৈরি করা হয়।', zh: '生产样品进行质量检查。' },
  'process.4.title': { en: 'Bulk Production', bn: 'বাল্ক উৎপাদন', zh: '批量生产' },
  'process.4.desc': { en: 'Full-scale production with strict quality control.', bn: 'কঠোর মান নিয়ন্ত্রণ সহ পূর্ণ-মাত্রায় উৎপাদন।', zh: '严格质量控制下的全面生产。' },
  'process.5.title': { en: 'Delivery', bn: 'ডেলিভারি', zh: '交付' },
  'process.5.desc': { en: 'Timely delivery across Bangladesh.', bn: 'সারা বাংলাদেশে সময়মতো ডেলিভারি।', zh: '在孟加拉国全境准时交付。' },
  // Products
  'products.title': { en: 'Our Products', bn: 'আমাদের পণ্যসমূহ', zh: '我们的产品' },
  'products.all': { en: 'All', bn: 'সব', zh: '全部' },
  'products.corporate': { en: 'Corporate', bn: 'কর্পোরেট', zh: '企业' },
  'products.souvenir': { en: 'Souvenir', bn: 'স্মারক', zh: '纪念品' },
  'products.stationery': { en: 'Stationery', bn: 'স্টেশনারি', zh: '文具' },
  // Clients
  'clients.title': { en: 'Our Trusted Clients', bn: 'আমাদের বিশ্বস্ত ক্লায়েন্ট', zh: '我们的信赖客户' },
  'clients.subtitle': { en: 'We are proud to have served prestigious government and private organizations', bn: 'আমরা গর্বের সাথে বিভিন্ন সরকারি ও বেসরকারি প্রতিষ্ঠানে সেবা প্রদান করেছি', zh: '我们很自豪能为知名政府和私营机构提供服务' },
  // Contact
  'contact.title': { en: 'Contact Us', bn: 'যোগাযোগ করুন', zh: '联系我们' },
  'contact.name': { en: 'Your Name', bn: 'আপনার নাম', zh: '您的姓名' },
  'contact.email': { en: 'Your Email', bn: 'আপনার ইমেইল', zh: '您的邮箱' },
  'contact.phone': { en: 'Your Phone', bn: 'আপনার ফোন', zh: '您的电话' },
  'contact.message': { en: 'Your Message', bn: 'আপনার মেসেজ', zh: '您的留言' },
  'contact.send': { en: 'Send Message', bn: 'মেসেজ পাঠান', zh: '发送消息' },
  'contact.whatsapp': { en: 'Chat on WhatsApp', bn: 'WhatsApp এ চ্যাট করুন', zh: '通过WhatsApp聊天' },
  'contact.address': { en: 'Address', bn: 'ঠিকানা', zh: '地址' },
  'contact.addressValue': { en: 'Dhaka, Bangladesh', bn: 'ঢাকা, বাংলাদেশ', zh: '孟加拉国达卡' },
  // Quote Request
  'quote.title': { en: 'Request a Quote', bn: 'কোটেশন অনুরোধ করুন', zh: '请求报价' },
  'quote.subtitle': { en: 'Need customized corporate gifts in bulk? Fill out the form below and we\'ll get back to you with a detailed quote.', bn: 'বাল্কে কাস্টমাইজড কর্পোরেট গিফট প্রয়োজন? নিচের ফর্মটি পূরণ করুন এবং আমরা আপনাকে বিস্তারিত কোটেশন পাঠাব।', zh: '需要批量定制企业礼品？填写以下表格，我们将为您提供详细报价。' },
  'quote.companyName': { en: 'Company / Organization Name', bn: 'কোম্পানি / প্রতিষ্ঠানের নাম', zh: '公司/组织名称' },
  'quote.contactPerson': { en: 'Contact Person', bn: 'যোগাযোগকারী ব্যক্তি', zh: '联系人' },
  'quote.email': { en: 'Email Address', bn: 'ইমেইল ঠিকানা', zh: '电子邮箱' },
  'quote.phone': { en: 'Phone Number', bn: 'ফোন নম্বর', zh: '电话号码' },
  'quote.productInterest': { en: 'Product Interest (e.g. Crystal, Tie)', bn: 'পণ্যের আগ্রহ (যেমন ক্রিস্টাল, টাই)', zh: '感兴趣的产品（如水晶、领带）' },
  'quote.quantity': { en: 'Estimated Quantity', bn: 'আনুমানিক পরিমাণ', zh: '估计数量' },
  'quote.message': { en: 'Describe your requirements', bn: 'আপনার চাহিদা বর্ণনা করুন', zh: '描述您的需求' },
  'quote.uploadLogo': { en: 'Upload Company Logo', bn: 'কোম্পানির লোগো আপলোড করুন', zh: '上传公司标志' },
  'quote.uploadHint': { en: 'PNG, JPG, SVG or PDF — Max 5MB', bn: 'PNG, JPG, SVG বা PDF — সর্বোচ্চ ৫MB', zh: 'PNG、JPG、SVG或PDF — 最大5MB' },
  'quote.submit': { en: 'Submit Quote Request', bn: 'কোটেশন অনুরোধ জমা দিন', zh: '提交报价请求' },
  'quote.submitting': { en: 'Submitting...', bn: 'জমা হচ্ছে...', zh: '提交中...' },
  'quote.success': { en: 'Quote request submitted successfully! We\'ll contact you soon.', bn: 'কোটেশন অনুরোধ সফলভাবে জমা হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।', zh: '报价请求提交成功！我们将尽快与您联系。' },
  'quote.error': { en: 'Failed to submit. Please try again.', bn: 'জমা দিতে ব্যর্থ। আবার চেষ্টা করুন।', zh: '提交失败，请重试。' },
  'quote.requiredError': { en: 'Please fill in all required fields.', bn: 'সকল আবশ্যক ক্ষেত্র পূরণ করুন।', zh: '请填写所有必填字段。' },
  'quote.fileTypeError': { en: 'Only PNG, JPG, SVG or PDF files allowed.', bn: 'শুধুমাত্র PNG, JPG, SVG বা PDF ফাইল অনুমোদিত।', zh: '仅允许PNG、JPG、SVG或PDF文件。' },
  'quote.fileSizeError': { en: 'File must be under 5MB.', bn: 'ফাইল ৫MB এর কম হতে হবে।', zh: '文件必须小于5MB。' },
  // Footer
  'footer.rights': { en: 'All rights reserved.', bn: 'সর্বস্বত্ব সংরক্ষিত।', zh: '版权所有。' },
  'footer.desc': { en: 'Your trusted partner for customized corporate gifts & promotional products.', bn: 'কাস্টমাইজড কর্পোরেট গিফট ও প্রমোশনাল পণ্যের আপনার বিশ্বস্ত অংশীদার।', zh: '您定制企业礼品和促销产品的值得信赖的合作伙伴。' },
  'footer.quicklinks': { en: 'Quick Links', bn: 'দ্রুত লিংক', zh: '快速链接' },
  'footer.contactinfo': { en: 'Contact Info', bn: 'যোগাযোগ তথ্য', zh: '联系信息' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('en');
  const toggleLang = () => setLangState(l => l === 'en' ? 'bn' : l === 'bn' ? 'zh' : 'en');
  const setLang = (l: Lang) => setLangState(l);
  const t = (key: string) => translations[key]?.[lang] ?? translations[key]?.['en'] ?? key;
  const tt = (en: string, bn: string, zh: string) => {
    if (lang === 'zh') return zh || en;
    if (lang === 'bn') return bn || en;
    return en;
  };
  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLang, t, tt }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
