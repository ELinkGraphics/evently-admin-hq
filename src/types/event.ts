
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
}
