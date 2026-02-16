import TopBar from '@/components/TopBar';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import MobileBottomBar from '@/components/MobileBottomBar';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import ProcessSection from '@/components/ProcessSection';
import ProductsSection from '@/components/ProductsSection';
import ClientsSection from '@/components/ClientsSection';
import BulkOrderCalculator from '@/components/BulkOrderCalculator';
import QuoteRequestForm from '@/components/QuoteRequestForm';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen pb-14 md:pb-0">
      <TopBar />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProcessSection />
        <ProductsSection />
        <ClientsSection />
        <BulkOrderCalculator />
        <QuoteRequestForm />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppFloat />
      <MobileBottomBar />
    </div>
  );
};

export default Index;
