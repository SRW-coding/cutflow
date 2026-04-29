import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
  subscription?: {
    status: string;
    plan?: { name: string; tier: string };
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export const authApi = {
  register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return api.post('/auth/register', data);
  },

  login(data: { email: string; password: string }): Promise<AuthResponse> {
    return api.post('/auth/login', data);
  },

  logout(refreshToken: string): Promise<{ success: boolean }> {
    return api.post('/auth/logout', { refreshToken });
  },

  refresh(refreshToken: string): Promise<AuthResponse> {
    return api.post('/auth/refresh', { refreshToken });
  },

  getMe(): Promise<{ user: AuthUser }> {
    return api.get('/auth/me');
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return api.post('/auth/forgot-password', { email });
  },

  verifyOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    return api.post('/auth/verify-otp', { email, otp });
  },

  resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/reset-password', { token, newPassword });
  },
};
