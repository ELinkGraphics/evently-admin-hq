
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const PaymentStatusBadge = ({ status }: { status?: string }) => {
  let color: "secondary" | "default" | "destructive" = "default";
  if (status === "pending") color = "secondary";
  if (status === "completed") color = "default";
  if (status === "failed" || status === "refunded") color = "destructive";
  return (
    <Badge className="capitalize" variant={color}>
      {status ?? "unknown"}
    </Badge>
  );
};

export const ChapaWebhookTestTable = () => {
  const [refreshCount, setRefreshCount] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["ticket_purchases", refreshCount],
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

  return (
    <Card className="mb-6 w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Webhook Table (Local DB)</CardTitle>
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
              <TableHead>Buyer</TableHead>
              <TableHead>Tx Ref</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
              : (data && data.length > 0 ? (
                data.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.buyer_name || <span className="text-gray-400">N/A</span>}</div>
                      <div className="text-xs text-muted-foreground">{row.buyer_email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="truncate max-w-[120px] block" title={row.chapa_tx_ref || ""}>
                        {row.chapa_tx_ref || <span className="text-gray-400">N/A</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600">
                        ETB {Number(row.amount_paid).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={row.payment_status} />
                    </TableCell>
                    <TableCell>
                      <span title={row.purchase_date}>
                        {row.purchase_date ? new Date(row.purchase_date).toLocaleString() : "N/A"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No purchase records found.</TableCell>
                </TableRow>
              ))
            }
            {error && (
              <TableRow>
                <TableCell colSpan={5} className="text-red-500 text-center">{error.message}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
