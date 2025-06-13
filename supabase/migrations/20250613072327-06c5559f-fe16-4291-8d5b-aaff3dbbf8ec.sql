
-- Add check-in functionality columns to ticket_purchases table
ALTER TABLE ticket_purchases 
ADD COLUMN checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN check_in_time TIMESTAMP WITH TIME ZONE;
