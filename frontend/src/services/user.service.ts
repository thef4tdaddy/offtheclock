import axios from 'axios';
import { UserProfileSchema, type UpdateProfilePayload, type UserProfile } from '../domain/schemas/user';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await axios.get('/api/auth/users/me');
    return UserProfileSchema.parse(response.data);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<void> {
    await axios.put('/api/auth/users/me', payload);
  }
};
