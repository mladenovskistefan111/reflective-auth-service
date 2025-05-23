// Note: This file may not be strictly necessary when using Prisma,
// as Prisma generates its own type definitions. However, it can be
// useful for defining additional model-specific types, interfaces,
// or methods that extend Prisma's generated types.

import { User as PrismaUser } from '@prisma/client';

// Extend Prisma's User type if needed
export interface User extends PrismaUser {}

// Define types for user creation
export interface CreateUserInput {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

// Define user response (without sensitive data)
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

// Helper function to create safe user response (without password)
export function toUserResponse(user: PrismaUser): UserResponse {
  const { password, verifyToken, resetToken, resetExpires, ...safeUser } = user;
  return safeUser as UserResponse;
}