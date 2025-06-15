
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChapaLiveAPI } from "./useChapaLiveAPI";

export const ChapaLiveVerifyTable = () => {
  const { data, isLoading, error } = useChapaLiveAPI();

  if (isLoading) {
    return <Card className="mb-6"><CardHeader><CardTitle>Chapa Live Table (API JSON)</CardTitle></CardHeader>
      <CardContent>Loading...</CardContent></Card>;
  }
  if (error) {
    return <Card className="mb-6"><CardHeader><CardTitle>Chapa Live Table (API JSON)</CardTitle></CardHeader>
      <CardContent>Error: {error.message}</CardContent></Card>;
  }

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Chapa Live Table (API JSON)</CardTitle></CardHeader>
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
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={4}>No verification results.</TableCell>
              </TableRow>
            )}
            {data && data.map((item: any, idx: number) => (
              <TableRow key={idx}>
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
