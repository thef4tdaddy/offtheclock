import { describe, it, expect } from 'vitest';
import { generateRecurringShifts } from './shifts';

describe('generateRecurringShifts', () => {
  it('should generate shifts for selected days correctly', () => {
    // Use Jan 1st 2024 12:00 Local Time to avoid timezone rollover issues with getDay()
    const startDate = new Date(2024, 0, 1, 12, 0, 0); // Mon Jan 01 2024
    const selectedDays = [1, 3, 5]; // Mon, Wed, Fri
    const startTime = '09:00';
    const endTime = '17:00';
    const duration = 1; // 1 year

    const shifts = generateRecurringShifts(selectedDays, startTime, endTime, startDate, duration);

    expect(shifts.length).toBeGreaterThan(150);

    // Check first shift
    const firstShift = shifts[0];
    const sDate = new Date(firstShift.start_time);
    const eDate = new Date(firstShift.end_time);

    // Should be Jan 1 (Monday)
    expect(sDate.getFullYear()).toBe(2024);
    expect(sDate.getMonth()).toBe(0); // Jan
    expect(sDate.getDate()).toBe(1);
    expect(sDate.getHours()).toBe(9);
    expect(eDate.getHours()).toBe(17);

    // Check recurrence (Next should be Wed Jan 3)
    const secondShift = shifts[1];
    const sDate2 = new Date(secondShift.start_time);
    expect(sDate2.getDate()).toBe(3);
    expect(sDate2.getDay()).toBe(3); // Wednesday
  });

  it('should handle overnight shifts', () => {
    // Use Jan 1st 2024 12:00 Local
    const startDate = new Date(2024, 0, 1, 12, 0, 0);
    const selectedDays = [1]; // Mon only
    const startTime = '22:00';
    const endTime = '06:00';

    const shifts = generateRecurringShifts(selectedDays, startTime, endTime, startDate, 1);

    const firstShift = shifts[0];
    const sDate = new Date(firstShift.start_time);
    const eDate = new Date(firstShift.end_time);

    // Start: Mon 22:00
    expect(sDate.getDate()).toBe(1);
    expect(sDate.getHours()).toBe(22);

    // End: Tue 06:00
    expect(eDate.getDate()).toBe(2);
    expect(eDate.getHours()).toBe(6);
  });

  it('should return empty array if no days selected', () => {
    const shifts = generateRecurringShifts([], '09:00', '17:00');
    expect(shifts).toHaveLength(0);
  });
});
