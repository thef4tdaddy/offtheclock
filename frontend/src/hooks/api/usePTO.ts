import { useQuery } from '@tanstack/react-query';
import { ptoService } from '../../services/pto.service';

export const usePTOCategories = () => {
  return useQuery({
    queryKey: ['ptoCategories'],
    queryFn: ptoService.getCategories,
  });
};

export const usePTOLogs = () => {
  return useQuery({
    queryKey: ['ptoLogs'],
    queryFn: ptoService.getLogs,
  });
};

export const usePTOForecast = (targetDate: string) => {
  return useQuery({
    queryKey: ['ptoForecast', targetDate],
    queryFn: () => ptoService.getForecast(targetDate),
    enabled: !!targetDate, // Only fetch if date is present
  });
};
