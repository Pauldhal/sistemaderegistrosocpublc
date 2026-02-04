-- Create table for user grid data
CREATE TABLE public.user_grid_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grid_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"tasa": 90, "comision": 12}'::jsonb,
  registers JSONB NOT NULL DEFAULT '{"daily": {}, "weekly": {}, "monthly": {}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_grid_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view their own data"
ON public.user_grid_data
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert their own data"
ON public.user_grid_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update their own data"
ON public.user_grid_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete their own data"
ON public.user_grid_data
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_grid_data;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_grid_data_updated_at
BEFORE UPDATE ON public.user_grid_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();