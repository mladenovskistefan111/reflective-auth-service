import { User as PrismaUser } from '@prisma/client';

export interface User extends PrismaUser {}

export interface CreateUserInput {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserResponse(user: PrismaUser): UserResponse {
  const { password, verifyToken, resetToken, resetExpires, ...safeUser } = user;
  return safeUser as UserResponse;
}