import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsService, type Shift, type ShiftCreate } from '../../services/shifts.service';

export type { Shift, ShiftCreate };

export const useShifts = () => {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: shiftsService.getShifts,
  });
};

export const useCreateShiftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftsService.createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['ptoLogs'] }); // Auto-UPT update (key name match usePTO.ts)
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};

export const useCreateBatchShiftsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftsService.createBatchShifts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['ptoLogs'] });
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};

export const useDeleteShiftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftsService.deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['ptoLogs'] });
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};
