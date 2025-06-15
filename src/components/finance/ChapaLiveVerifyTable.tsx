
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ChapaLiveVerifyTable = () => {
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

  const { data: verifyData, isLoading: loadingVerify, error: errorVerify } = useQuery({
    queryKey: ["chapa-live-verify", txRefs],
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

  if (loadingDB || loadingVerify) {
    return <Card className="mb-6"><CardHeader><CardTitle>Chapa Live Table (From Chapa API)</CardTitle></CardHeader>
      <CardContent>Loading...</CardContent></Card>;
  }
  if (errorDB) {
    return <Card className="mb-6"><CardHeader><CardTitle>Chapa Live Table (From Chapa API)</CardTitle></CardHeader>
      <CardContent>DB Error: {errorDB.message}</CardContent></Card>;
  }
  if (errorVerify) {
    return <Card className="mb-6"><CardHeader><CardTitle>Chapa Live Table (From Chapa API)</CardTitle></CardHeader>
      <CardContent>Verify Error: {errorVerify.message}</CardContent></Card>;
  }

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Chapa Live Table (From Chapa API)</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tx Ref</TableHead>
              <TableHead>Chapa API Status</TableHead>
              <TableHead>API Raw Data</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!verifyData || verifyData.length === 0) && (
              <TableRow>
                <TableCell colSpan={4}>No verification results.</TableCell>
              </TableRow>
            )}
            {verifyData && verifyData.map((item: any) => (
              <TableRow key={item.tx_ref}>
                <TableCell>{item.tx_ref}</TableCell>
                <TableCell>{item.chapa_status ? item.chapa_status : <span className="text-gray-400">N/A</span>}</TableCell>
                <TableCell>
                  <pre className="whitespace-pre-wrap max-w-[250px] overflow-x-auto text-xs">
                    {item.chapa_data ? JSON.stringify(item.chapa_data, null, 1) : "N/A"}
                  </pre>
                </TableCell>
                <TableCell>
                  {item.error ? <span className="text-red-500">{item.error}</span> : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
