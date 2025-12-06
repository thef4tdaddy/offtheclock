import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import { type UpdateProfilePayload } from '../../domain/schemas/user';

export const useUser = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getProfile,
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getProfile,
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};
