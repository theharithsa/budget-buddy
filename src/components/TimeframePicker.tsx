import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/types';

export interface DateRange {
  from: string;
  to: string;
}

interface TimeframePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

// Utility functions for date calculations
const getCurrentMonth = (): DateRange => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0); // Last day of current month
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
};

const getLastMonth = (): DateRange => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0); // Last day of previous month
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
};

const getLast30Days = (): DateRange => {
  const now = new Date();
  const from = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0]
  };
};

const getLast90Days = (): DateRange => {
  const now = new Date();
  const from = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  
  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0]
  };
};

const getCurrentYear = (): DateRange => {
  const now = new Date();
  const year = now.getFullYear();
  
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`
  };
};

const getAllTime = (): DateRange => {
  const now = new Date();
  
  return {
    from: '2020-01-01', // Reasonable start date
    to: now.toISOString().split('T')[0]
  };
};

// Preset options
const PRESET_OPTIONS = [
  { label: 'Current Month', value: 'current-month', getFn: getCurrentMonth },
  { label: 'Last Month', value: 'last-month', getFn: getLastMonth },
  { label: 'Last 30 Days', value: 'last-30', getFn: getLast30Days },
  { label: 'Last 90 Days', value: 'last-90', getFn: getLast90Days },
  { label: 'Current Year', value: 'current-year', getFn: getCurrentYear },
  { label: 'All Time', value: 'all-time', getFn: getAllTime },
  { label: 'Custom Range', value: 'custom', getFn: () => ({ from: '', to: '' }) },
];

export function TimeframePicker({ dateRange, onDateRangeChange, className = '' }: TimeframePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('current-month');
  const [customFrom, setCustomFrom] = useState(dateRange.from);
  const [customTo, setCustomTo] = useState(dateRange.to);

  // Format display text for the current range
  const getDisplayText = () => {
    if (!dateRange.from || !dateRange.to) return 'Select timeframe';
    
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    // Check if it matches a preset
    const currentMonth = getCurrentMonth();
    if (dateRange.from === currentMonth.from && dateRange.to === currentMonth.to) {
      return 'Current Month';
    }
    
    const lastMonth = getLastMonth();
    if (dateRange.from === lastMonth.from && dateRange.to === lastMonth.to) {
      return 'Last Month';
    }
    
    // Check for relative ranges (approximate)
    const daysDiff = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 32 && daysDiff >= 28) {
      const preset = PRESET_OPTIONS.find(p => p.value === 'last-30');
      const range = preset?.getFn();
      if (range && Math.abs(new Date(range.from).getTime() - fromDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        return 'Last 30 Days';
      }
    }
    
    if (daysDiff <= 95 && daysDiff >= 85) {
      return 'Last 90 Days';
    }
    
    // Custom range display
    const fromFormatted = fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const toFormatted = toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (fromDate.getFullYear() === toDate.getFullYear()) {
      return `${fromFormatted} - ${toFormatted}`;
    } else {
      return `${fromFormatted} ${fromDate.getFullYear()} - ${toFormatted} ${toDate.getFullYear()}`;
    }
  };

  const handlePresetSelect = (value: string) => {
    setSelectedPreset(value);
    
    if (value === 'custom') {
      setCustomFrom(dateRange.from);
      setCustomTo(dateRange.to);
      return;
    }
    
    const preset = PRESET_OPTIONS.find(p => p.value === value);
    if (preset) {
      const range = preset.getFn();
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      // Ensure from is before to
      if (new Date(customFrom) <= new Date(customTo)) {
        onDateRangeChange({ from: customFrom, to: customTo });
        setIsOpen(false);
      }
    }
  };

  const handleReset = () => {
    const currentMonth = getCurrentMonth();
    onDateRangeChange(currentMonth);
    setSelectedPreset('current-month');
    setIsOpen(false);
  };

  // Calculate some stats for the current range
  const daysDiff = dateRange.from && dateRange.to 
    ? Math.round((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-between min-w-[200px] bg-background"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{getDisplayText()}</span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Timeframe</Label>
              <p className="text-xs text-muted-foreground">Select a preset or custom date range</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-select" className="text-sm">Quick Presets</Label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset === 'custom' && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Custom Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="from-date" className="text-xs">From</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-date" className="text-xs">To</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCustomApply}
                  disabled={!customFrom || !customTo || new Date(customFrom) > new Date(customTo)}
                  className="w-full"
                  size="sm"
                >
                  Apply Custom Range
                </Button>
              </div>
            )}

            {/* Current selection info */}
            {dateRange.from && dateRange.to && (
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Current Selection</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>From: {formatDate(dateRange.from)}</div>
                  <div>To: {formatDate(dateRange.to)}</div>
                  <Badge variant="secondary" className="text-xs">
                    {daysDiff} {daysDiff === 1 ? 'day' : 'days'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
