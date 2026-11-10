import React from 'react';
import { cn } from '@/lib/utils';

interface BusyTimeEntry {
  hours: string[];
  values: number[];
}

interface BusyTimesChartProps {
  busyTimes?: Record<string, number[] | BusyTimeEntry>;
  operatingHours?: Record<string, string>;
  className?: string;
}

const getBarColor = (value: number): string => {
  if (value <= 3) return 'bg-green-400 dark:bg-green-500';
  if (value <= 5) return 'bg-yellow-400 dark:bg-yellow-500';
  if (value <= 7) return 'bg-orange-400 dark:bg-orange-500';
  return 'bg-red-400 dark:bg-red-500';
};

const getCallLabel = (value: number): string => {
  if (value <= 3) return '✅ Best time to call';
  if (value <= 5) return 'OK to call';
  if (value <= 7) return '⚠️ Busy';
  return '🔴 Peak - avoid calling';
};

// Normalize busy_times to a consistent format
const normalizeBusyTimes = (
  busyTimes: Record<string, number[] | BusyTimeEntry>
): Record<string, { hours: string[]; values: number[] }> => {
  const result: Record<string, { hours: string[]; values: number[] }> = {};
  
  for (const [day, data] of Object.entries(busyTimes)) {
    if (Array.isArray(data) && typeof data[0] === 'number') {
      // Legacy format: plain number array (assumed 6AM-8PM)
      const defaultHours = ['6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM'];
      const values = data as number[];
      result[day] = {
        hours: defaultHours.slice(0, values.length),
        values,
      };
    } else if (data && typeof data === 'object' && 'hours' in data && 'values' in data) {
      result[day] = data as BusyTimeEntry;
    }
  }
  
  return result;
};

const getOptimalTimes = (
  normalized: Record<string, { hours: string[]; values: number[] }>
): string[] => {
  const optimal: string[] = [];
  const dayAbbr: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
  };

  for (const [day, { hours, values }] of Object.entries(normalized)) {
    values.forEach((v, i) => {
      if (v <= 3) {
        optimal.push(`${dayAbbr[day] || day} ${hours[i]}`);
      }
    });
  }

  return optimal.slice(0, 5);
};

export const BusyTimesChart: React.FC<BusyTimesChartProps> = ({
  busyTimes,
  operatingHours,
  className,
}) => {
  if (!busyTimes || Object.keys(busyTimes).length === 0) return null;

  const normalized = normalizeBusyTimes(busyTimes);
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const activeDays = dayOrder.filter(d => normalized[d]);
  const optimalTimes = getOptimalTimes(normalized);

  if (activeDays.length === 0) return null;

  const dayAbbr: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Operating Hours */}
      {operatingHours && Object.keys(operatingHours).length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {dayOrder.filter(d => operatingHours[d] && operatingHours[d] !== 'Closed').map(day => (
            <span key={day}>
              <span className="font-medium">{dayAbbr[day]}</span> {operatingHours[day]}
            </span>
          ))}
        </div>
      )}

      {/* Optimal Contact Windows */}
      {optimalTimes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-medium text-green-700 dark:text-green-300">
            Best to call:
          </span>
          {optimalTimes.map((time, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full"
            >
              {time}
            </span>
          ))}
        </div>
      )}

      {/* Heat Map Chart */}
      <div className="bg-muted/30 rounded-lg p-2 overflow-x-auto">
        <div className="min-w-[280px]">
          {activeDays.map(day => {
            const { hours, values } = normalized[day];
            return (
              <div key={day} className="flex items-center gap-0.5 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground w-7">
                  {dayAbbr[day]}
                </span>
                <div className="flex gap-px">
                  {values.map((value, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={cn(
                        "w-[18px] h-3 rounded-sm transition-all",
                        getBarColor(value)
                      )}
                      style={{ opacity: 0.4 + (value / 10) * 0.6 }}
                      title={`${hours[hourIdx]}: ${getCallLabel(value)}`}
                    />
                  ))}
                </div>
                {/* Show hour labels for first row only */}
                {day === activeDays[0] && (
                  <div className="flex gap-px ml-1">
                    {hours.filter((_, i) => i % 3 === 0).map((h, i) => (
                      <span key={i} className="text-[8px] text-muted-foreground">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-muted">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-500" />
              <span className="text-[9px] text-muted-foreground">Best to call</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-yellow-400 dark:bg-yellow-500" />
              <span className="text-[9px] text-muted-foreground">OK</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-500" />
              <span className="text-[9px] text-muted-foreground">Busy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-400 dark:bg-red-500" />
              <span className="text-[9px] text-muted-foreground">Peak</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
