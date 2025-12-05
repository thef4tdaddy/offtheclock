import { describe, it, expect } from 'vitest';
import { generateRecurringShifts } from './shifts';

describe('generateRecurringShifts', () => {
  it('should generate shifts for selected days correctly', () => {
    // Mock current date potentially inside logic?
    // The utility uses `targetDate.setFullYear(targetDate.getFullYear() + durationInYears);`
    // Let's pass a fixed startDate if the utility supports it, otherwise we test relative length.

    // Actually the utility signature is:
    // (selectedDays: number[], startTime: string, endTime: string, startDateStr?: string, durationInYears?: number) => ShiftCreate[]

    const startDate = '2024-01-01'; // Monday
    const selectedDays = [1, 3, 5]; // Mon, Wed, Fri
    const startTime = '09:00';
    const endTime = '17:00';
    const duration = 1; // 1 year

    const shifts = generateRecurringShifts(
      selectedDays,
      startTime,
      endTime,
      new Date(startDate),
      duration,
    );

    expect(shifts.length).toBeGreaterThan(150); // Roughly 3 * 52 = 156

    // Check first shift
    const firstShift = shifts[0];
    expect(firstShift.start_time).toContain('2024-01-01T09:00');
    expect(firstShift.end_time).toContain('2024-01-01T17:00');

    // Check recurrence
    // 2024-01-01 is Mon. Next should be 2024-01-03 (Wed)
    const secondShift = shifts[1];
    expect(secondShift.start_time).toContain('2024-01-03T09:00');
  });

  it('should handle overnight shifts', () => {
    const startDate = '2024-01-01';
    const selectedDays = [1]; // Mon only
    const startTime = '22:00';
    const endTime = '06:00';

    const shifts = generateRecurringShifts(
      selectedDays,
      startTime,
      endTime,
      new Date(startDate),
      1,
    );

    const firstShift = shifts[0];
    // Start: Mon 22:00
    expect(firstShift.start_time).toContain('2024-01-01T22:00');
    // End: Tue 06:00 (Next Day)
    expect(firstShift.end_time).toContain('2024-01-02T06:00');
  });

  it('should return empty array if no days selected', () => {
    const shifts = generateRecurringShifts([], '09:00', '17:00');
    expect(shifts).toHaveLength(0);
  });
});
