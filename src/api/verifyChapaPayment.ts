
/**
 * Verify payment status with Chapa and update Supabase ticket_purchases row.
 * Returns { payment_status, chapa_status, ... }
 */
export async function verifyChapaPayment(tx_ref: string) {
  console.log('Verifying Chapa payment for tx_ref:', tx_ref);
  
  if (!tx_ref) {
    throw new Error('Transaction reference is required');
  }

  try {
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Verification API error:', response.status, errorData);
      throw new Error(errorData.error || `Payment verification failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Verification API response:', result);
    return result;
  } catch (error: any) {
    console.error('Payment verification error:', error);
    throw new Error(error.message || "Payment verification failed. Please contact support.");
  }
}
