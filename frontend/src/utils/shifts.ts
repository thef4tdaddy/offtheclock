import type { ShiftCreate } from '../services/shifts.service';

export const generateRecurringShifts = (
  selectedDays: number[],
  startTime: string,
  endTime: string,
  startDate: Date = new Date(),
  durationYears: number = 1,
): ShiftCreate[] => {
  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + durationYears);

  const shifts: ShiftCreate[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (selectedDays.includes(d.getDay())) {
      const dateStr = d.toISOString().split('T')[0];
      const sTime = new Date(`${dateStr}T${startTime}`);
      const eTime = new Date(`${dateStr}T${endTime}`);

      // Handle overnight shifts
      if (eTime < sTime) {
        eTime.setDate(eTime.getDate() + 1);
      }

      shifts.push({
        start_time: sTime.toISOString(),
        end_time: eTime.toISOString(),
      });
    }
  }

  return shifts;
};
