import { api } from './client';
import type { AuthUser } from './auth';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

export const usersApi = {
  updateProfile(data: UpdateProfilePayload): Promise<AuthUser> {
    return api.patch('/users/profile', data);
  },

  changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean }> {
    return api.post('/users/change-password', data);
  },
};
