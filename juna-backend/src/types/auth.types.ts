import { User } from '@prisma/client';

export interface SendVerificationCodeDTO {
  email: string;
}

export interface VerifyCodeDTO {
  email: string;
  code: string;
}

export interface RegisterDTO {
  email: string;
  verifiedToken: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  isProfileComplete: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}