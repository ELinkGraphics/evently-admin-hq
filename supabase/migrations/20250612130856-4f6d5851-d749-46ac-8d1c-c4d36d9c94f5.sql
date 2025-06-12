
-- Add price field to events table
ALTER TABLE public.events ADD COLUMN price DECIMAL(10,2) DEFAULT 0;

-- Add published status and public link tracking
ALTER TABLE public.events ADD COLUMN is_published BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN public_link TEXT;

-- Create table for ticket purchases
CREATE TABLE public.ticket_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tickets_quantity INTEGER NOT NULL DEFAULT 1,
  amount_paid DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger to automatically update updated_at for ticket_purchases
CREATE TRIGGER update_ticket_purchases_updated_at 
    BEFORE UPDATE ON public.ticket_purchases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for ticket_purchases
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on ticket_purchases for now
CREATE POLICY "Allow all operations on ticket_purchases" 
  ON public.ticket_purchases 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime for ticket_purchases table
ALTER TABLE public.ticket_purchases REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_purchases;
