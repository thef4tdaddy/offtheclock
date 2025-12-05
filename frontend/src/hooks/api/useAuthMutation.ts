import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { type LoginCredentials } from '../../domain/schemas/auth';

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
  });
};
