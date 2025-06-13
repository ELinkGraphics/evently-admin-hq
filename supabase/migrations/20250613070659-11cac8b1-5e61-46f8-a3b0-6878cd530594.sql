
-- Update the foreign key constraint for ticket_purchases to ensure proper referential integrity
ALTER TABLE public.ticket_purchases 
DROP CONSTRAINT IF EXISTS ticket_purchases_event_id_fkey;

ALTER TABLE public.ticket_purchases 
ADD CONSTRAINT ticket_purchases_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Add an index for better performance when querying tickets by event
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON public.ticket_purchases(event_id);

-- Add validation to ensure amount_paid is positive
ALTER TABLE public.ticket_purchases 
ADD CONSTRAINT check_positive_amount_paid CHECK (amount_paid > 0);

-- Add validation to ensure tickets_quantity is positive
ALTER TABLE public.ticket_purchases 
ADD CONSTRAINT check_positive_tickets_quantity CHECK (tickets_quantity > 0);

-- Update events table to track total tickets sold
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0;

-- Create a function to update tickets sold and revenue when a purchase is made
CREATE OR REPLACE FUNCTION update_event_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update tickets sold and revenue for new purchase
    UPDATE public.events 
    SET 
      tickets_sold = COALESCE(tickets_sold, 0) + NEW.tickets_quantity,
      revenue = COALESCE(revenue, 0) + NEW.amount_paid,
      attendees = COALESCE(attendees, 0) + NEW.tickets_quantity
    WHERE id = NEW.event_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update tickets sold and revenue when purchase is deleted
    UPDATE public.events 
    SET 
      tickets_sold = GREATEST(COALESCE(tickets_sold, 0) - OLD.tickets_quantity, 0),
      revenue = GREATEST(COALESCE(revenue, 0) - OLD.amount_paid, 0),
      attendees = GREATEST(COALESCE(attendees, 0) - OLD.tickets_quantity, 0)
    WHERE id = OLD.event_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update event stats
DROP TRIGGER IF EXISTS trigger_update_event_stats ON public.ticket_purchases;
CREATE TRIGGER trigger_update_event_stats
  AFTER INSERT OR DELETE ON public.ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_event_stats();
