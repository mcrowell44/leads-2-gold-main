-- Create industries table
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Allow public read, admin manage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'industries' AND policyname = 'Public can view industries'
  ) THEN
    CREATE POLICY "Public can view industries"
    ON public.industries
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'industries' AND policyname = 'Admins can manage industries'
  ) THEN
    CREATE POLICY "Admins can manage industries"
    ON public.industries
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname = 'update_industries_updated_at'
  ) THEN
    CREATE TRIGGER update_industries_updated_at
    BEFORE UPDATE ON public.industries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create prospects table (businesses)
CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  latitude NUMERIC,
  longitude NUMERIC,
  source TEXT NOT NULL DEFAULT 'seed',
  external_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, city, state)
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Public read, admin manage for prospects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prospects' AND policyname = 'Public can view prospects'
  ) THEN
    CREATE POLICY "Public can view prospects"
    ON public.prospects
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prospects' AND policyname = 'Admins can manage prospects'
  ) THEN
    CREATE POLICY "Admins can manage prospects"
    ON public.prospects
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- Trigger for updated_at on prospects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname = 'update_prospects_updated_at'
  ) THEN
    CREATE TRIGGER update_prospects_updated_at
    BEFORE UPDATE ON public.prospects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Helpful indexes for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_prospects_industry ON public.prospects(industry_id);
CREATE INDEX IF NOT EXISTS idx_prospects_sort ON public.prospects(is_active, website, rating DESC, reviews DESC);

-- Seed industries
INSERT INTO public.industries(name) VALUES
  ('Plumbing'),
  ('Real Estate'),
  ('Landscaping'),
  ('HVAC Services'),
  ('Roofing'),
  ('Auto Repair')
ON CONFLICT (name) DO NOTHING;

-- Seed sample prospects matching the app's placeholders
WITH inds AS (
  SELECT id, name FROM public.industries WHERE name IN (
    'Plumbing','Real Estate','Landscaping','HVAC Services','Roofing','Auto Repair'
  )
), seed(name, industry_name, rating, reviews, website, city, state) AS (
  VALUES
    ('Gold Star Plumbing Co.', 'Plumbing', 4.80, 120, NULL, 'Phoenix', 'AZ'),
    ('Frontier Real Estate', 'Real Estate', 4.50, 55, 'http://realestate.com', 'Denver', 'CO'),
    ('Prospector Landscaping', 'Landscaping', 5.00, 210, NULL, 'Sacramento', 'CA'),
    ('Canyon HVAC', 'HVAC Services', 4.90, 300, NULL, 'Las Vegas', 'NV'),
    ('High Noon Roofing', 'Roofing', 4.20, 80, 'http://roofing-services.com', 'Austin', 'TX'),
    ('Trailblazer Auto Repair', 'Auto Repair', 4.70, 150, NULL, 'Boise', 'ID')
)
INSERT INTO public.prospects (industry_id, name, rating, reviews, website, city, state, source)
SELECT i.id, s.name, s.rating, s.reviews, s.website, s.city, s.state, 'seed'
FROM seed s
JOIN inds i ON i.name = s.industry_name
ON CONFLICT (name, city, state) DO NOTHING;