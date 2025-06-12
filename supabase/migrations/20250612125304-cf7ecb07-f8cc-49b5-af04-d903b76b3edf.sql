
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  location TEXT NOT NULL,
  attendees INTEGER DEFAULT 0,
  capacity INTEGER NOT NULL,
  revenue DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Cancelled', 'Completed')),
  category TEXT NOT NULL,
  banner_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - for now we'll make it public accessible
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later when you add authentication)
CREATE POLICY "Allow all operations on events" 
  ON public.events 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime for events table
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
