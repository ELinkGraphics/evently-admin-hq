
-- Update the function to correctly handle inserts, updates, and deletes
-- based on the payment_status of a ticket purchase.
CREATE OR REPLACE FUNCTION public.update_event_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: a new purchase is made.
  -- We only increment stats if the purchase is 'completed'.
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'completed' THEN
    UPDATE public.events
    SET
      tickets_sold = COALESCE(tickets_sold, 0) + NEW.tickets_quantity,
      revenue = COALESCE(revenue, 0) + NEW.amount_paid,
      attendees = COALESCE(attendees, 0) + NEW.tickets_quantity
    WHERE id = NEW.event_id;

  -- Handle UPDATE: a purchase status changes.
  ELSIF TG_OP = 'UPDATE' THEN
    -- If a payment transitions TO 'completed' from another status.
    IF OLD.payment_status IS DISTINCT FROM 'completed' AND NEW.payment_status = 'completed' THEN
      UPDATE public.events
      SET
        tickets_sold = COALESCE(tickets_sold, 0) + NEW.tickets_quantity,
        revenue = COALESCE(revenue, 0) + NEW.amount_paid,
        attendees = COALESCE(attendees, 0) + NEW.tickets_quantity
      WHERE id = NEW.event_id;
    -- If a payment transitions FROM 'completed' (e.g., to 'failed' or 'refunded').
    ELSIF OLD.payment_status = 'completed' AND NEW.payment_status IS DISTINCT FROM 'completed' THEN
      UPDATE public.events
      SET
        tickets_sold = GREATEST(COALESCE(tickets_sold, 0) - OLD.tickets_quantity, 0),
        revenue = GREATEST(COALESCE(revenue, 0) - OLD.amount_paid, 0),
        attendees = GREATEST(COALESCE(attendees, 0) - OLD.tickets_quantity, 0)
      WHERE id = OLD.event_id;
    END IF;

  -- Handle DELETE: a purchase record is removed.
  -- We only decrement stats if the purchase was 'completed'.
  ELSIF TG_OP = 'DELETE' AND OLD.payment_status = 'completed' THEN
    UPDATE public.events
    SET
      tickets_sold = GREATEST(COALESCE(tickets_sold, 0) - OLD.tickets_quantity, 0),
      revenue = GREATEST(COALESCE(revenue, 0) - OLD.amount_paid, 0),
      attendees = GREATEST(COALESCE(attendees, 0) - OLD.tickets_quantity, 0)
    WHERE id = OLD.event_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to fire on UPDATE operations as well,
-- ensuring that status changes are captured.
DROP TRIGGER IF EXISTS trigger_update_event_stats ON public.ticket_purchases;
CREATE TRIGGER trigger_update_event_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_stats();
