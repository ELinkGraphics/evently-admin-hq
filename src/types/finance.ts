
// Utility types for future finance features

export interface FinanceKPI {
  totalRevenue: number;
  totalTicketsSold: number;
  averageTicketPrice: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface PaymentRecord {
  id: string;
  purchase_date: string;
  buyer_name: string;
  buyer_email: string;
  tickets_quantity: number;
  amount_paid: number;
}

export interface BudgetItem {
  category: string;
  planned: number;
  actual: number;
  notes?: string;
}
