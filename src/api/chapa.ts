
/**
 * Client helper for calling create-chapa-payment edge function.
 */
export async function createChapaPaymentSession({
  event_id,
  amount,
  email,
  first_name,
  last_name,
  phone_number,
  return_url,
}: {
  event_id: string;
  amount: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  return_url: string;
}) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1/create-chapa-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({
        event_id,
        amount,
        email,
        first_name,
        last_name,
        phone_number,
        tx_ref: `event_${event_id}_${Date.now()}`,
        return_url,
      }),
    }
  );

  if (!response.ok) {
    throw new Error((await response.json()).error || "Failed to start payment session");
  }

  return await response.json();
}
