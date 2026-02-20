
-- Fix RLS policies to require authentication instead of USING (true) for write operations

-- PRODUCTS
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products"
ON public.products FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- CATEGORIES
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- GALLERY
DROP POLICY IF EXISTS "Authenticated users can manage gallery" ON public.gallery;
CREATE POLICY "Authenticated users can manage gallery"
ON public.gallery FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- CLIENT LOGOS
DROP POLICY IF EXISTS "Authenticated users can manage client logos" ON public.client_logos;
CREATE POLICY "Authenticated users can manage client logos"
ON public.client_logos FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- HERO SLIDES
DROP POLICY IF EXISTS "Authenticated users can manage hero slides" ON public.hero_slides;
CREATE POLICY "Authenticated users can manage hero slides"
ON public.hero_slides FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ABOUT PAGE
DROP POLICY IF EXISTS "Authenticated users can manage about page" ON public.about_page;
CREATE POLICY "Authenticated users can manage about page"
ON public.about_page FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- PRODUCT VARIANTS
DROP POLICY IF EXISTS "Authenticated users can manage variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can manage variant images" ON public.product_variants;
CREATE POLICY "Authenticated users can manage variants"
ON public.product_variants FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- PRODUCT IMAGES
DROP POLICY IF EXISTS "Authenticated users can manage product images" ON public.product_images;
CREATE POLICY "Authenticated users can manage product images"
ON public.product_images FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- PRODUCT VARIANT IMAGES
DROP POLICY IF EXISTS "Authenticated users can manage variant images" ON public.product_variant_images;
CREATE POLICY "Authenticated users can manage variant images"
ON public.product_variant_images FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- SEO META
DROP POLICY IF EXISTS "Authenticated users can manage seo meta" ON public.seo_meta;
CREATE POLICY "Authenticated users can manage seo meta"
ON public.seo_meta FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- SITE SETTINGS
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON public.site_settings;
CREATE POLICY "Authenticated users can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

-- CONTACT MESSAGES (update/delete only for auth)
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can delete contact messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can update contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete contact messages"
ON public.contact_messages FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- QUOTE REQUESTS (update/delete only for auth)
DROP POLICY IF EXISTS "Authenticated users can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Authenticated users can delete quote requests" ON public.quote_requests;
CREATE POLICY "Authenticated users can update quote requests"
ON public.quote_requests FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete quote requests"
ON public.quote_requests FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');
