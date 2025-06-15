
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const StatusBadge = ({ status }: { status?: string }) => {
  let color: "secondary" | "default" | "destructive" = "default";
  if (status === "pending") color = "secondary";
  if (status === "success" || status === "completed") color = "default";
  if (status === "failed" || status === "refunded") color = "destructive";
  return (
    <Badge className="capitalize" variant={color}>
      {status ?? "unknown"}
    </Badge>
  );
};

export const ChapaLiveVerifyTable = () => {
  const [refreshCount, setRefreshCount] = useState(0);

  // First, get the latest ticket_purchases (same as the local DB table)
  const { data: purchases, isLoading: loadingDB, error: errorDB } = useQuery({
    queryKey: ["ticket_purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // For all tx_refs, call edge function with up to 20 recent tx_refs
  const txRefs = purchases?.map((row: any) => row.chapa_tx_ref).filter(Boolean);

  const { data: verifyData, isLoading: loadingVerify, error: errorVerify, refetch, isFetching } = useQuery({
    queryKey: ["chapa-live-verify", txRefs, refreshCount],
    queryFn: async () => {
      if (!txRefs || txRefs.length === 0) return [];
      const { data, error } = await supabase.functions.invoke("chapa-verify-table", {
        body: { tx_refs: txRefs }
      });
      if (error) throw error;
      return data?.results || [];
    },
    enabled: !!txRefs && txRefs.length > 0,
  });

  return (
    <Card className="mb-6 w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Chapa Live Table (From Chapa API)</CardTitle>
        <button
          className="ml-2 p-1 rounded hover:bg-muted transition-colors"
          title="Refresh table"
          onClick={() => { setRefreshCount((x) => x + 1); refetch(); }}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tx Ref</TableHead>
              <TableHead>Chapa API Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(loadingDB || loadingVerify)
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              )) :
              (verifyData && verifyData.length > 0 ? (
                verifyData.map((item: any) => (
                  <TableRow key={item.tx_ref}>
                    <TableCell>
                      <span className="truncate max-w-[120px] block" title={item.tx_ref || ""}>
                        {item.tx_ref || <span className="text-gray-400">N/A</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.chapa_status} />
                    </TableCell>
                    <TableCell>
                      {item.chapa_data && item.chapa_data.amount ?
                        (<span className="font-semibold text-blue-600">
                          ETB {Number(item.chapa_data.amount).toLocaleString()}
                        </span>)
                        : <span className="text-gray-400">N/A</span>
                      }
                    </TableCell>
                    <TableCell>
                      {item.chapa_data && item.chapa_data.created_at
                        ? <span title={item.chapa_data.created_at}>
                          {new Date(item.chapa_data.created_at).toLocaleString()}
                        </span>
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      {item.error ? <span className="text-red-500">{item.error}</span> : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No verification results.</TableCell>
                </TableRow>
              ))}
            {errorVerify && (
              <TableRow>
                <TableCell colSpan={5} className="text-red-500 text-center">{errorVerify.message}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
