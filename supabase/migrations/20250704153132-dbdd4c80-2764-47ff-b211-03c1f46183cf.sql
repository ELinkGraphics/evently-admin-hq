-- Update RLS policies to allow access without authentication

-- Drop existing restrictive policies for events
DROP POLICY IF EXISTS "Admin users can manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

-- Create new permissive policies for events (no authentication required)
CREATE POLICY "Allow all operations on events" 
  ON public.events 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Update ticket_purchases policies
DROP POLICY IF EXISTS "Admin users can manage ticket purchases" ON public.ticket_purchases;
DROP POLICY IF EXISTS "Authenticated users can view ticket purchases" ON public.ticket_purchases;

CREATE POLICY "Allow all operations on ticket_purchases" 
  ON public.ticket_purchases 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Update financial_transactions policies  
DROP POLICY IF EXISTS "Admin users can manage financial transactions" ON public.financial_transactions;

CREATE POLICY "Allow all operations on financial_transactions" 
  ON public.financial_transactions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);