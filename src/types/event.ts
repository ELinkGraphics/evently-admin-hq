export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time_start: string;
  time_end: string | null;
  location: string;
  attendees: number;
  capacity: number;
  revenue: number;
  status: 'Draft' | 'Active' | 'Cancelled' | 'Completed';
  category: string;
  banner_image: string | null;
  price: number;
  is_published: boolean;
  public_link: string | null;
  tickets_sold: number;
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
  buyer_phone: string | null;
  purchase_date: string;
  tickets_quantity: number;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}
