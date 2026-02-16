import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuoteBasketProvider } from "@/contexts/QuoteBasketContext";
import QuoteBasketDrawer from "@/components/QuoteBasketDrawer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Portfolio = lazy(() => import("./pages/Portfolio"));
const Catalog = lazy(() => import("./pages/Catalog"));
const GalleryPage = lazy(() => import("./pages/Gallery"));
const GiftConfigurator = lazy(() => import("./pages/GiftConfigurator"));

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

const queryClient = new QueryClient();

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <QuoteBasketProvider>
            <Toaster />
            <Sonner />
            <QuoteBasketDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalog" element={
                <Suspense fallback={<AdminFallback />}><Catalog /></Suspense>
              } />
              <Route path="/portfolio" element={
                <Suspense fallback={<AdminFallback />}><Portfolio /></Suspense>
              } />
              <Route path="/gallery" element={
                <Suspense fallback={<AdminFallback />}><GalleryPage /></Suspense>
              } />
              <Route path="/configurator" element={
                <Suspense fallback={<AdminFallback />}><GiftConfigurator /></Suspense>
              } />
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
