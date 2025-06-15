
-- Drop existing tables and dependencies
DROP TABLE IF EXISTS public.ticket_purchases CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Create enums for better data consistency
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE event_status_enum AS ENUM ('Draft', 'Active', 'Cancelled', 'Completed');
CREATE TYPE payment_method_enum AS ENUM ('chapa', 'bank_transfer', 'cash', 'mobile_money');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'admin', 'moderator', 'viewer');

-- Recreate events table with proper structure
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  attendees INTEGER DEFAULT 0 CHECK (attendees >= 0),
  tickets_sold INTEGER DEFAULT 0 CHECK (tickets_sold >= 0),
  revenue DECIMAL(12,2) DEFAULT 0 CHECK (revenue >= 0),
  price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
  status event_status_enum DEFAULT 'Draft',
  category TEXT NOT NULL,
  banner_image TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  public_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_attendees_capacity CHECK (attendees <= capacity),
  CONSTRAINT valid_tickets_sold_capacity CHECK (tickets_sold <= capacity)
);

-- Create event_categories reference table
CREATE TABLE public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.event_categories (name, description) VALUES
  ('Conference', 'Professional conferences and seminars'),
  ('Workshop', 'Educational workshops and training sessions'),
  ('Concert', 'Musical performances and concerts'),
  ('Sports', 'Sports events and competitions'),
  ('Festival', 'Festivals and cultural events'),
  ('Networking', 'Professional networking events'),
  ('Exhibition', 'Trade shows and exhibitions'),
  ('Other', 'Other types of events');

-- Create admin_users table for authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role_enum DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_purchases table with comprehensive structure
CREATE TABLE public.ticket_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tickets_quantity INTEGER NOT NULL DEFAULT 1 CHECK (tickets_quantity > 0),
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
  checked_in BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  payment_method payment_method_enum DEFAULT 'chapa',
  payment_status payment_status_enum DEFAULT 'pending',
  chapa_transaction_id TEXT,
  chapa_checkout_url TEXT,
  raw_chapa_data JSONB,
  refund_amount DECIMAL(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.admin_users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_transactions table for detailed tracking
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_purchase_id UUID REFERENCES public.ticket_purchases(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'revenue', 'refund', 'fee', 'expense'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ETB',
  description TEXT,
  external_transaction_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_tracking table for event costs
CREATE TABLE public.expense_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'venue', 'catering', 'marketing', 'staff', 'equipment', 'other'
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'ETB',
  receipt_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendee_feedback table
CREATE TABLE public.attendee_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_purchase_id UUID REFERENCES public.ticket_purchases(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_published ON public.events(is_published);

CREATE INDEX idx_ticket_purchases_event_id ON public.ticket_purchases(event_id);
CREATE INDEX idx_ticket_purchases_buyer_email ON public.ticket_purchases(buyer_email);
CREATE INDEX idx_ticket_purchases_payment_status ON public.ticket_purchases(payment_status);
CREATE INDEX idx_ticket_purchases_purchase_date ON public.ticket_purchases(purchase_date);

CREATE INDEX idx_audit_logs_admin_user_id ON public.audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

CREATE INDEX idx_financial_transactions_event_id ON public.financial_transactions(event_id);
CREATE INDEX idx_financial_transactions_processed_at ON public.financial_transactions(processed_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_purchases_updated_at 
    BEFORE UPDATE ON public.ticket_purchases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON public.admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function and trigger for event stats update
CREATE OR REPLACE FUNCTION public.update_event_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: a new purchase is made
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'completed' THEN
    UPDATE public.events
    SET
      tickets_sold = COALESCE(tickets_sold, 0) + NEW.tickets_quantity,
      revenue = COALESCE(revenue, 0) + NEW.amount_paid,
      attendees = COALESCE(attendees, 0) + NEW.tickets_quantity
    WHERE id = NEW.event_id;
    
    -- Insert financial transaction record
    INSERT INTO public.financial_transactions (event_id, ticket_purchase_id, transaction_type, amount, description)
    VALUES (NEW.event_id, NEW.id, 'revenue', NEW.amount_paid, 'Ticket purchase revenue');

  -- Handle UPDATE: payment status changes
  ELSIF TG_OP = 'UPDATE' THEN
    -- Payment transitions TO 'completed'
    IF OLD.payment_status IS DISTINCT FROM 'completed' AND NEW.payment_status = 'completed' THEN
      UPDATE public.events
      SET
        tickets_sold = COALESCE(tickets_sold, 0) + NEW.tickets_quantity,
        revenue = COALESCE(revenue, 0) + NEW.amount_paid,
        attendees = COALESCE(attendees, 0) + NEW.tickets_quantity
      WHERE id = NEW.event_id;
      
      INSERT INTO public.financial_transactions (event_id, ticket_purchase_id, transaction_type, amount, description)
      VALUES (NEW.event_id, NEW.id, 'revenue', NEW.amount_paid, 'Payment completed');
    
    -- Payment transitions FROM 'completed' to refunded
    ELSIF OLD.payment_status = 'completed' AND NEW.payment_status = 'refunded' THEN
      UPDATE public.events
      SET
        tickets_sold = GREATEST(COALESCE(tickets_sold, 0) - OLD.tickets_quantity, 0),
        revenue = GREATEST(COALESCE(revenue, 0) - OLD.amount_paid, 0),
        attendees = GREATEST(COALESCE(attendees, 0) - OLD.tickets_quantity, 0)
      WHERE id = OLD.event_id;
      
      INSERT INTO public.financial_transactions (event_id, ticket_purchase_id, transaction_type, amount, description)
      VALUES (OLD.event_id, OLD.id, 'refund', -OLD.amount_paid, COALESCE(NEW.refund_reason, 'Ticket refund'));
    END IF;

  -- Handle DELETE: purchase record is removed
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

CREATE TRIGGER trigger_update_event_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_stats();

-- Create materialized view for dashboard KPIs
CREATE MATERIALIZED VIEW public.dashboard_kpis AS
SELECT 
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT CASE WHEN e.status = 'Active' AND e.date >= CURRENT_DATE THEN e.id END) as upcoming_events,
  COUNT(DISTINCT tp.id) as total_purchases,
  COALESCE(SUM(CASE WHEN tp.payment_status = 'completed' THEN tp.amount_paid ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN tp.payment_status = 'completed' THEN tp.tickets_quantity ELSE 0 END), 0) as total_tickets_sold,
  COUNT(DISTINCT CASE WHEN tp.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN tp.id END) as weekly_purchases,
  COUNT(DISTINCT CASE WHEN tp.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN tp.id END) as monthly_purchases
FROM public.events e
LEFT JOIN public.ticket_purchases tp ON e.id = tp.event_id;

-- Create index on the materialized view
CREATE UNIQUE INDEX idx_dashboard_kpis ON public.dashboard_kpis ((1));

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_dashboard_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_kpis;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (adjust as needed)
CREATE POLICY "Allow all operations on events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ticket_purchases" ON public.ticket_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on financial_transactions" ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on expense_tracking" ON public.expense_tracking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attendee_feedback" ON public.attendee_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read on event_categories" ON public.event_categories FOR SELECT USING (true);

-- Enable realtime for all tables
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_purchases REPLICA IDENTITY FULL;
ALTER TABLE public.financial_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- Insert sample admin user
INSERT INTO public.admin_users (email, full_name, role) VALUES
  ('admin@example.com', 'System Administrator', 'super_admin');
