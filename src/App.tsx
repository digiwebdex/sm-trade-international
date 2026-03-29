import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import { QuoteBasketProvider } from "@/contexts/QuoteBasketContext";
import QuoteBasketDrawer from "@/components/QuoteBasketDrawer";
import Index from "./pages/Index";
import PublicLayout from "./components/PublicLayout";
import NotFound from "./pages/NotFound";

const Portfolio = lazy(() => import("./pages/Portfolio"));
const About = lazy(() => import("./pages/About"));
const Catalog = lazy(() => import("./pages/Catalog"));
const GalleryPage = lazy(() => import("./pages/Gallery"));
const GiftConfigurator = lazy(() => import("./pages/GiftConfigurator"));
const ARProductPreview = lazy(() => import("./pages/ARProductPreview"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ProductGallery = lazy(() => import("./pages/ProductGallery"));

// Minimal fallback – prevents the jarring full-screen spinner flash
const PageFallback = () => (
  <div className="min-h-[60vh]" />
);

// Lazy-load admin routes – they're never needed on the public site
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ProtectedRoute = lazy(() => import("./components/admin/ProtectedRoute"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminImport = lazy(() => import("./pages/admin/AdminImport"));
const AdminHomeSections = lazy(() => import("./pages/admin/AdminHomeSections"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminProcess = lazy(() => import("./pages/admin/AdminProcess"));
const AdminHeroSlides = lazy(() => import("./pages/admin/AdminHeroSlides"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminBackup = lazy(() => import("./pages/admin/AdminBackup"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));
const AdminQuoteRequests = lazy(() => import("./pages/admin/AdminQuoteRequests"));
const AdminFooter = lazy(() => import("./pages/admin/AdminFooter"));
const AdminContactInfo = lazy(() => import("./pages/admin/AdminContactInfo"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min – avoid refetching on every mount
      gcTime: 10 * 60 * 1000,     // 10 min garbage collection
      refetchOnWindowFocus: false, // prevent refetch on tab switch
      retry: 1,
    },
  },
});

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
  </div>
);

// App root
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <QuoteBasketProvider>
            <Toaster />
            <Sonner />
            <QuoteBasketDrawer />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/catalog" element={
                  <Suspense fallback={<PageFallback />}><Catalog /></Suspense>
                } />
                <Route path="/portfolio" element={
                  <Suspense fallback={<PageFallback />}><Portfolio /></Suspense>
                } />
                <Route path="/about" element={
                  <Suspense fallback={<PageFallback />}><About /></Suspense>
                } />
                <Route path="/gallery" element={
                  <Suspense fallback={<PageFallback />}><GalleryPage /></Suspense>
                } />
                <Route path="/configurator" element={
                  <Suspense fallback={<PageFallback />}><GiftConfigurator /></Suspense>
                } />
                <Route path="/3d-preview" element={
                  <Suspense fallback={<PageFallback />}><ARProductPreview /></Suspense>
                } />
                <Route path="/product/:id" element={
                  <Suspense fallback={<PageFallback />}><ProductDetail /></Suspense>
                } />
                <Route path="/products" element={
                  <Suspense fallback={<PageFallback />}><ProductGallery /></Suspense>
                } />
              </Route>
              <Route path="/admin/login" element={
                <Suspense fallback={<AdminFallback />}><AdminLogin /></Suspense>
              } />
              <Route path="/admin" element={
                <Suspense fallback={<AdminFallback />}>
                  <ProtectedRoute><AdminLayout /></ProtectedRoute>
                </Suspense>
              }>
                <Route index element={<Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>} />
                <Route path="products" element={<Suspense fallback={<AdminFallback />}><AdminProducts /></Suspense>} />
                <Route path="categories" element={<Suspense fallback={<AdminFallback />}><AdminCategories /></Suspense>} />
                <Route path="gallery" element={<Suspense fallback={<AdminFallback />}><AdminGallery /></Suspense>} />
                <Route path="clients" element={<Suspense fallback={<AdminFallback />}><AdminClients /></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<AdminFallback />}><AdminMessages /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<AdminFallback />}><AdminSettings /></Suspense>} />
                <Route path="import" element={<Suspense fallback={<AdminFallback />}><AdminImport /></Suspense>} />
                <Route path="home-sections" element={<Suspense fallback={<AdminFallback />}><AdminHomeSections /></Suspense>} />
                <Route path="services" element={<Suspense fallback={<AdminFallback />}><AdminServices /></Suspense>} />
                <Route path="process" element={<Suspense fallback={<AdminFallback />}><AdminProcess /></Suspense>} />
                <Route path="hero-slides" element={<Suspense fallback={<AdminFallback />}><AdminHeroSlides /></Suspense>} />
                <Route path="seo" element={<Suspense fallback={<AdminFallback />}><AdminSEO /></Suspense>} />
                <Route path="backup" element={<Suspense fallback={<AdminFallback />}><AdminBackup /></Suspense>} />
                <Route path="about" element={<Suspense fallback={<AdminFallback />}><AdminAbout /></Suspense>} />
                <Route path="quotes" element={<Suspense fallback={<AdminFallback />}><AdminQuoteRequests /></Suspense>} />
                <Route path="footer" element={<Suspense fallback={<AdminFallback />}><AdminFooter /></Suspense>} />
                <Route path="contact" element={<Suspense fallback={<AdminFallback />}><AdminContactInfo /></Suspense>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </QuoteBasketProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
