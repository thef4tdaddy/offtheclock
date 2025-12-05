import axios from 'axios';
import { type LoginCredentials, TokenResponseSchema, type TokenResponse } from '../domain/schemas/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axios.post('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Validate response with Zod
    return TokenResponseSchema.parse(response.data);
  },
};
