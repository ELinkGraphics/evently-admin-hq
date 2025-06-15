
import { useQuery } from "@tanstack/react-query";

export function useChapaWebhookAPI() {
  return useQuery({
    queryKey: ["chapa_webhook_api"],
    queryFn: async () => {
      const res = await fetch("/chapa-webhook.json");
      if (!res.ok) throw new Error("Failed to fetch Chapa Webhook data");
      return res.json();
    },
  });
}
