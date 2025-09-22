import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDateRange } from "@/contexts/date-range-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  className?: string;
}

export default function DateRangePicker({ className }: DateRangePickerProps) {
  const {
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    startDate,
    endDate,
    setCustomDateRange
  } = useDateRange();
  
  const isMobile = useIsMobile();

  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(customStartDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(customEndDate);

  // Sync temporary dates when context values change or popover opens
  useEffect(() => {
    if (isOpen) {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
    }
  }, [isOpen, customStartDate, customEndDate]);

  const handleQuickRangeSelect = (range: "current-month" | "30-days" | "60-days" | "90-days") => {
    setDateRange(range);
    setIsOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (tempStartDate && tempEndDate) {
      setCustomDateRange(tempStartDate, tempEndDate);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(customStartDate);
    setTempEndDate(customEndDate);
    setIsOpen(false);
  };

  const isCustomRangeValid = tempStartDate && tempEndDate && tempStartDate <= tempEndDate;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[200px] sm:min-w-[240px]",
            className
          )}
          data-testid="button-date-range-picker"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange === "custom" && customStartDate && customEndDate ? (
            <span>
              {format(customStartDate, "MMM d, yyyy")} - {format(customEndDate, "MMM d, yyyy")}
            </span>
          ) : (
            <span>
              {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
            </span>
          )}
          <Badge variant="secondary" className="ml-2 text-xs">
            {dateRange === "custom" ? "Custom" : 
             dateRange === "current-month" ? "Current Month" : 
             dateRange}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium">Quick Select</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant={dateRange === "current-month" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRangeSelect("current-month")}
                data-testid="button-range-current-month"
              >
                Current Month
              </Button>
              <Button
                variant={dateRange === "30-days" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRangeSelect("30-days")}
                data-testid="button-range-30-days"
              >
                30 Days
              </Button>
              <Button
                variant={dateRange === "60-days" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRangeSelect("60-days")}
                data-testid="button-range-60-days"
              >
                60 Days
              </Button>
              <Button
                variant={dateRange === "90-days" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRangeSelect("90-days")}
                data-testid="button-range-90-days"
              >
                90 Days
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Custom Range</Label>
            <div className="mt-2">
              <Calendar
                mode="range"
                defaultMonth={tempStartDate || new Date()}
                selected={tempStartDate && tempEndDate ? { from: tempStartDate, to: tempEndDate } : undefined}
                onSelect={(range) => {
                  if (range?.from) {
                    setTempStartDate(range.from);
                  }
                  if (range?.to) {
                    setTempEndDate(range.to);
                  }
                  // Auto-apply when both dates are selected
                  if (range?.from && range?.to) {
                    setCustomDateRange(range.from, range.to);
                    setIsOpen(false);
                  }
                }}
                numberOfMonths={isMobile ? 1 : 2}
                data-testid="calendar-range-picker"
              />
            </div>
            
            {tempStartDate && tempEndDate && (
              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleCustomRangeApply}
                  disabled={!isCustomRangeValid}
                  className="flex-1"
                  data-testid="button-apply-custom-range"
                >
                  <Check className="mr-2 h-3 w-3" />
                  Apply Range
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  data-testid="button-cancel-range"
                >
                  <X className="mr-2 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}