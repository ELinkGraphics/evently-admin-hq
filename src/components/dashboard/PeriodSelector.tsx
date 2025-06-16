
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriod } from "@/lib/dateUtils";

interface PeriodSelectorProps {
  value: TimePeriod;
  onValueChange: (value: TimePeriod) => void;
}

export const PeriodSelector = ({ value, onValueChange }: PeriodSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Last Week</SelectItem>
        <SelectItem value="month">Last Month</SelectItem>
        <SelectItem value="quarter">Last Quarter</SelectItem>
        <SelectItem value="year">Last Year</SelectItem>
      </SelectContent>
    </Select>
  );
};
