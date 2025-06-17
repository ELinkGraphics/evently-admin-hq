
-- Create event_budgets table for budget management
CREATE TABLE public.event_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ETB',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate budget categories per event
ALTER TABLE public.event_budgets 
ADD CONSTRAINT event_budgets_event_category_unique 
UNIQUE (event_id, category);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_budgets_updated_at 
    BEFORE UPDATE ON public.event_budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.event_budgets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later when you add authentication)
CREATE POLICY "Allow all operations on event_budgets" 
  ON public.event_budgets 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime for event_budgets table
ALTER TABLE public.event_budgets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_budgets;
