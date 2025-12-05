export const formatHours = (decimalHours: number): string => {
  const isNegative = decimalHours < 0;
  const absoluteHours = Math.abs(decimalHours);

  const hours = Math.floor(absoluteHours);
  const minutes = Math.round((absoluteHours - hours) * 60);

  if (hours === 0 && minutes === 0) return '0h';

  let result = '';
  if (hours > 0) result += `${hours}h`;
  if (minutes > 0) result += ` ${minutes}m`;

  return (isNegative ? '-' : '') + result.trim();
};

export const parseDuration = (input: string): number | null => {
  if (!input) return null;
  const cleanInput = input.toLowerCase().trim();

  // 1. Decimal check (e.g. "1.5")
  if (!isNaN(Number(cleanInput))) {
    return parseFloat(cleanInput);
  }

  // 2. Colon format (e.g. "1:30")
  if (cleanInput.includes(':')) {
    const [h, m] = cleanInput.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      return h + m / 60;
    }
  }

  // 3. "1h 30m" or "90m" format
  let totalHours = 0;

  // Extract hours
  const hoursMatch = cleanInput.match(/(\d+(\.\d+)?)\s*h/);
  if (hoursMatch) {
    totalHours += parseFloat(hoursMatch[1]);
  }

  // Extract minutes
  const minutesMatch = cleanInput.match(/(\d+(\.\d+)?)\s*m/);
  if (minutesMatch) {
    totalHours += parseFloat(minutesMatch[1]) / 60;
  }

  // If we found neither but it wasn't a plain number, return null (invalid)
  if (!hoursMatch && !minutesMatch) {
    return null;
  }

  return totalHours;
};
