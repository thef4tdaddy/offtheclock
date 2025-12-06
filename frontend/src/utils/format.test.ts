import { describe, it, expect } from 'vitest';
import { formatHours, parseDuration } from './format';

describe('formatHours', () => {
  it('formats whole hours correctly', () => {
    expect(formatHours(1)).toBe('1h');
    expect(formatHours(10)).toBe('10h');
    expect(formatHours(24)).toBe('24h');
  });

  it('formats hours with minutes correctly', () => {
    expect(formatHours(1.5)).toBe('1h 30m');
    expect(formatHours(2.25)).toBe('2h 15m');
    expect(formatHours(10.75)).toBe('10h 45m');
  });

  it('formats zero hours correctly', () => {
    expect(formatHours(0)).toBe('0h');
    expect(formatHours(0.0)).toBe('0h');
  });

  it('formats only minutes correctly', () => {
    expect(formatHours(0.5)).toBe('30m');
    expect(formatHours(0.25)).toBe('15m');
    expect(formatHours(0.75)).toBe('45m');
  });

  it('formats negative hours correctly', () => {
    expect(formatHours(-1)).toBe('-1h');
    expect(formatHours(-1.5)).toBe('-1h 30m');
    expect(formatHours(-0.5)).toBe('-30m');
  });

  it('handles fractional minutes with rounding', () => {
    expect(formatHours(1.0833333)).toBe('1h 5m'); // 5 minutes
    expect(formatHours(1.9833333)).toBe('1h 59m'); // 59 minutes
  });
});

describe('parseDuration', () => {
  describe('decimal format', () => {
    it('parses decimal hours', () => {
      expect(parseDuration('1.5')).toBe(1.5);
      expect(parseDuration('2.25')).toBe(2.25);
      expect(parseDuration('10')).toBe(10);
      expect(parseDuration('0.5')).toBe(0.5);
    });
  });

  describe('colon format', () => {
    it('parses hours:minutes format', () => {
      expect(parseDuration('1:30')).toBe(1.5);
      expect(parseDuration('2:15')).toBe(2.25);
      expect(parseDuration('10:00')).toBe(10);
      expect(parseDuration('0:30')).toBe(0.5);
    });

    it('handles various minute values', () => {
      expect(parseDuration('1:00')).toBe(1);
      expect(parseDuration('1:15')).toBe(1.25);
      expect(parseDuration('1:45')).toBe(1.75);
      expect(parseDuration('2:30')).toBe(2.5);
    });
  });

  describe('text format with h and m', () => {
    it('parses hours only', () => {
      expect(parseDuration('1h')).toBe(1);
      expect(parseDuration('10h')).toBe(10);
      expect(parseDuration('2.5h')).toBe(2.5);
    });

    it('parses minutes only', () => {
      expect(parseDuration('30m')).toBe(0.5);
      expect(parseDuration('15m')).toBe(0.25);
      expect(parseDuration('90m')).toBe(1.5);
    });

    it('parses hours and minutes combined', () => {
      expect(parseDuration('1h 30m')).toBe(1.5);
      expect(parseDuration('2h 15m')).toBe(2.25);
      expect(parseDuration('10h 45m')).toBe(10.75);
    });

    it('handles spacing variations', () => {
      expect(parseDuration('1h30m')).toBe(1.5);
      expect(parseDuration('1h  30m')).toBe(1.5);
      expect(parseDuration('  1h 30m  ')).toBe(1.5);
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase letters', () => {
      expect(parseDuration('1H 30M')).toBe(1.5);
      expect(parseDuration('1H')).toBe(1);
      expect(parseDuration('30M')).toBe(0.5);
    });
  });

  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseDuration('')).toBeNull();
    });

    it('returns null for invalid input', () => {
      expect(parseDuration('abc')).toBeNull();
      expect(parseDuration('hello')).toBeNull();
      expect(parseDuration('xyz')).toBeNull();
    });

    it('handles zero values', () => {
      expect(parseDuration('0')).toBe(0);
      expect(parseDuration('0h')).toBe(0);
      expect(parseDuration('0m')).toBe(0);
      expect(parseDuration('0:00')).toBe(0);
    });
  });
});
