import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { subDays, startOfDay, endOfDay, differenceInDays, startOfMonth, endOfMonth } from "date-fns";

type DateRange = "current-month" | "30-days" | "60-days" | "90-days" | "custom";

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  customStartDate: Date | undefined;
  setCustomStartDate: (date: Date | undefined) => void;
  customEndDate: Date | undefined;
  setCustomEndDate: (date: Date | undefined) => void;
  startDate: Date;
  endDate: Date;
  dayCount: number;
  budgetMultiplier: number;
  // Add convenient method for setting custom range
  setCustomDateRange: (start: Date, end: Date) => void;
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within DateRangeProvider');
  }
  return context;
};

interface DateRangeProviderProps {
  children: ReactNode;
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  const [dateRange, setDateRange] = useState<DateRange>("current-month");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // Calculate date range
  const { startDate, endDate, dayCount, budgetMultiplier } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    if (dateRange === "custom" && customStartDate && customEndDate) {
      start = customStartDate;
      end = customEndDate;
    } else {
      switch (dateRange) {
        case "current-month":
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case "30-days":
          start = subDays(now, 30);
          break;
        case "60-days":
          start = subDays(now, 60);
          break;
        case "90-days":
          start = subDays(now, 90);
          break;
        default:
          start = startOfMonth(now);
          end = endOfMonth(now);
      }
    }
    
    const dayCount = differenceInDays(endOfDay(end), startOfDay(start)) + 1;
    const budgetMultiplier = dayCount / 30; // Convert to monthly proportion
    
    return {
      startDate: startOfDay(start),
      endDate: endOfDay(end),
      dayCount,
      budgetMultiplier
    };
  }, [dateRange, customStartDate, customEndDate]);

  const setCustomDateRange = (start: Date, end: Date) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDateRange("custom");
  };

  return (
    <DateRangeContext.Provider value={{
      dateRange,
      setDateRange,
      customStartDate,
      setCustomStartDate,
      customEndDate,
      setCustomEndDate,
      startDate,
      endDate,
      dayCount,
      budgetMultiplier,
      setCustomDateRange
    }}>
      {children}
    </DateRangeContext.Provider>
  );
}