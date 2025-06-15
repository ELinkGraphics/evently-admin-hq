
-- Create event_custom_fields table to define dynamic fields per event
CREATE TABLE public.event_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'number', 'select', 'textarea')),
  field_options JSONB NULL, -- For select fields, stores the options
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_event_custom_fields_event_id ON public.event_custom_fields(event_id);
CREATE INDEX idx_event_custom_fields_order ON public.event_custom_fields(event_id, field_order);

-- Add custom_fields column to ticket_purchases to store dynamic field values
ALTER TABLE public.ticket_purchases 
ADD COLUMN custom_fields JSONB NULL,
ADD COLUMN first_name TEXT NULL,
ADD COLUMN last_name TEXT NULL,
ADD COLUMN chapa_tx_ref TEXT NULL;

-- Update buyer_name to be nullable since we'll use first_name + last_name instead
ALTER TABLE public.ticket_purchases 
ALTER COLUMN buyer_name DROP NOT NULL;

-- Add indexes for better performance on new columns
CREATE INDEX idx_ticket_purchases_tx_ref ON public.ticket_purchases(chapa_tx_ref);
CREATE INDEX idx_ticket_purchases_custom_fields ON public.ticket_purchases USING GIN(custom_fields);

-- Enable RLS on event_custom_fields table
ALTER TABLE public.event_custom_fields ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to custom fields (needed for public ticket purchase)
CREATE POLICY "Public can view event custom fields" 
  ON public.event_custom_fields 
  FOR SELECT 
  USING (true);

-- Create policy for authenticated users to manage custom fields
CREATE POLICY "Authenticated users can manage event custom fields" 
  ON public.event_custom_fields 
  FOR ALL 
  USING (true);
