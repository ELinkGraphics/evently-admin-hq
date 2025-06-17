
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterX } from "lucide-react";

interface ActivityFiltersProps {
  selectedType: string;
  selectedStatus: string;
  onTypeChange: (type: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

export const ActivityFilters = ({
  selectedType,
  selectedStatus,
  onTypeChange,
  onStatusChange,
  onClearFilters
}: ActivityFiltersProps) => {
  const hasActiveFilters = selectedType !== 'all' || selectedStatus !== 'all';

  return (
    <div className="flex items-center gap-3 mb-4">
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="purchase">Purchases</SelectItem>
          <SelectItem value="event">Events</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <FilterX className="w-4 h-4 mr-2" />
          Clear
        </Button>
      )}

      {hasActiveFilters && (
        <Badge variant="secondary" className="text-xs">
          Filtered
        </Badge>
      )}
    </div>
  );
};
