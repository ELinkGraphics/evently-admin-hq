
-- Add payment fields for Chapa integration to ticket_purchases

ALTER TABLE public.ticket_purchases
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS chapa_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS chapa_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Optionally, update any future or existing queries/views to consider payment_status in business logic.
