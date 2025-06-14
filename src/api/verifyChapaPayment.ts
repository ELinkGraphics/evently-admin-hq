
/**
 * Verify payment status with Chapa and update Supabase ticket_purchases row.
 * Returns { payment_status, chapa_status, ... }
 */
export async function verifyChapaPayment(tx_ref: string) {
  const response = await fetch(
    "https://oqxtwyvkcyzqusjurpcs.supabase.co/functions/v1/verify-chapa-payment",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xeHR3eXZrY3l6cXVzanVycGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzE5MjQsImV4cCI6MjA2NTMwNzkyNH0.IcQKOaM0D6BpA6tmarNivD28xobxosNE0Qq455z631E",
      },
      body: JSON.stringify({ tx_ref }),
    }
  );

  if (!response.ok) {
    throw new Error((await response.json()).error || "Payment verification failed.");
  }
  return await response.json();
}
