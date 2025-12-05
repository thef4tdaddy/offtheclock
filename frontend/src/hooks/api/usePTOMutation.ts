import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ptoService } from '../../services/pto.service';
import { type CreateCategoryPayload, type CreateLogPayload } from '../../domain/schemas/pto';

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => ptoService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateCategoryPayload }) => 
      ptoService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ptoService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};

export const useCreateLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLogPayload) => ptoService.createLog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoLogs'] });
      // Also invalidate categories because balances might change
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};

export const useDeleteLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ptoService.deleteLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoLogs'] });
      queryClient.invalidateQueries({ queryKey: ['ptoCategories'] });
    },
  });
};
