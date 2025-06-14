
ALTER TABLE public.ticket_purchases
  ADD COLUMN IF NOT EXISTS raw_chapa_data JSONB;
