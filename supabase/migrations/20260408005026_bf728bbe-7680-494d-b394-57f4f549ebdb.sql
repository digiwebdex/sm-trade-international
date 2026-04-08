
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  cat_prefix TEXT;
  ts_part TEXT;
  rand_part TEXT;
BEGIN
  IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
    -- Get category prefix
    SELECT UPPER(LEFT(name_en, 3)) INTO cat_prefix
    FROM public.categories WHERE id = NEW.category_id;
    
    cat_prefix := COALESCE(cat_prefix, 'PRD');
    
    -- Timestamp-based part (base36-ish)
    ts_part := UPPER(SUBSTRING(MD5(EXTRACT(EPOCH FROM NOW())::TEXT) FROM 1 FOR 5));
    
    -- Random suffix
    rand_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3));
    
    NEW.product_code := cat_prefix || '-' || ts_part || '-' || rand_part;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_product_code
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_code();
