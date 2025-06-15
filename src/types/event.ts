export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type EventStatus = 'Draft' | 'Active' | 'Cancelled' | 'Completed';
export type PaymentMethod = 'chapa' | 'bank_transfer' | 'cash' | 'mobile_money';
export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'viewer';

export interface Event {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  time_start: string;
  time_end?: string | null;
  location: string;
  capacity: number;
  attendees: number;
  tickets_sold: number;
  revenue: number;
  price: number;
  status: EventStatus;
  category: string;
  banner_image?: string | null;
  is_published: boolean;
  public_link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  name: string;
  description?: string;
  date: string;
  time_start: string;
  time_end?: string;
  location: string;
  capacity: number;
  category: string;
  banner_image?: string;
  price: number;
}

export interface TicketPurchase {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_email: string;
  chapa_tx_ref?: string | null;
  buyer_phone?: string | null;
  purchase_date: string;
  tickets_quantity: number;
  amount_paid: number;
  checked_in: boolean;
  check_in_time?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  chapa_transaction_id?: string | null;
  chapa_checkout_url?: string | null;
  raw_chapa_data?: any;
  refund_amount?: number | null;
  refund_reason?: string | null;
  refunded_at?: string | null;
  created_at: string;
  updated_at: string;
  custom_fields?: any;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_user_id?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_values?: any;
  new_values?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface ExpenseTracking {
  id: string;
  event_id: string;
  category: string;
  description: string;
  amount: number;
  currency?: string | null;
  receipt_url?: string | null;
  paid_at?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface AttendeeFeedback {
  id: string;
  event_id: string;
  ticket_purchase_id: string;
  rating?: number | null;
  feedback_text?: string | null;
  submitted_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  event_id?: string | null;
  ticket_purchase_id?: string | null;
  transaction_type: string;
  amount: number;
  currency?: string | null;
  description?: string | null;
  external_transaction_id?: string | null;
  processed_at: string;
  created_at: string;
}

export interface EventCustomField {
  id: string;
  event_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  field_options?: any | null; // for select fields, usually an array or object
  is_required: boolean;
  field_order: number;
  created_at: string;
}
