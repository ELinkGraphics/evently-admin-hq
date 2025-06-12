
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export const EventFilters = () => {
  return (
    <div className="bg-white/60 backdrop-blur-sm border border-border rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-10 bg-white/50 border-border"
          />
        </div>
        
        <Select>
          <SelectTrigger className="w-48 bg-white/50">
            <SelectValue placeholder="Event Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-48 bg-white/50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="art">Art</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="bg-white/50 hover:bg-white/80">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>
    </div>
  );
};
