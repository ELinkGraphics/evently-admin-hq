
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChapaWebhookAPI } from "./useChapaWebhookAPI";

export const ChapaWebhookTestTable = () => {
  const { data, isLoading, error } = useChapaWebhookAPI();

  if (isLoading) {
    return <Card className="mb-6"><CardHeader><CardTitle>Webhook Table (Local API JSON)</CardTitle></CardHeader>
      <CardContent>Loading...</CardContent></Card>;
  }
  if (error) {
    return <Card className="mb-6"><CardHeader><CardTitle>Webhook Table (Local API JSON)</CardTitle></CardHeader>
      <CardContent>Error: {error.message}</CardContent></Card>;
  }

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Webhook Table (Local API JSON)</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Tx Ref</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Webhook Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>No purchase records found.</TableCell>
              </TableRow>
            )}
            {data && data.map((row: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{row.buyer_name || <span className="text-gray-400">N/A</span>}</TableCell>
                <TableCell>{row.chapa_tx_ref || <span className="text-gray-400">N/A</span>}</TableCell>
                <TableCell>${Number(row.amount_paid).toLocaleString()}</TableCell>
                <TableCell>{row.payment_status}</TableCell>
                <TableCell>
                  <pre className="whitespace-pre-wrap max-w-[250px] overflow-x-auto text-xs">{row.raw_chapa_data ? JSON.stringify(row.raw_chapa_data, null, 1) : "N/A"}</pre>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
