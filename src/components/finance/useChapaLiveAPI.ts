
import { useQuery } from "@tanstack/react-query";

export function useChapaLiveAPI() {
  return useQuery({
    queryKey: ["chapa_live_api"],
    queryFn: async () => {
      const res = await fetch("/chapa-live.json");
      if (!res.ok) throw new Error("Failed to fetch Chapa Live API data");
      return res.json();
    },
  });
}
