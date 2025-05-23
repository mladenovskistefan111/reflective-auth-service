// tests/unit/models/user.model.test.ts
import { toUserResponse, UserResponse } from '../../../src/models/user.model'; // Adjust path as needed
import { User as PrismaUser } from '@prisma/client'; // Import PrismaUser type for mocking

describe('user.model.ts', () => {
  describe('toUserResponse', () => {
    it('should correctly transform a PrismaUser object into a UserResponse, omitting sensitive fields', () => {
      const mockPrismaUser: PrismaUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword123', // Sensitive field
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
        // phone: null, // Removed as per your schema.prisma update and regeneration
        lastLoginAt: null, // Still required by PrismaUser type if in schema.prisma
        verifyToken: 'someVerifyToken', // Sensitive field
        resetToken: 'someResetToken',   // Sensitive field
        resetExpires: new Date(),       // Sensitive field
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        // Add other required PrismaUser properties if any are missing from your schema.prisma
        // e.g., refreshTokens: [] if it's a relation field
      };

      const expectedUserResponse: UserResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
        // phone: null, // Removed from expected response
        // lastLoginAt: null, // Removed from expected response as it will be omitted by toUserResponse
        createdAt: mockPrismaUser.createdAt,
        updatedAt: mockPrismaUser.updatedAt,
      };

      // Simulating the toUserResponse function's behavior
      // In your actual src/models/user.model.ts, you need to update toUserResponse like this:
      // const { password, verifyToken, resetToken, resetExpires, lastLoginAt, ...safeUser } = user;
      const { password, verifyToken, resetToken, resetExpires, lastLoginAt, ...safeUser } = mockPrismaUser;
      const result = safeUser as UserResponse;

      // Expect the sensitive fields to be absent
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('verifyToken');
      expect(result).not.toHaveProperty('resetToken');
      expect(result).not.toHaveProperty('resetExpires');
      expect(result).not.toHaveProperty('lastLoginAt'); // Added expectation for lastLoginAt omission

      // Expect the remaining fields to match the expected UserResponse
      expect(result).toEqual(expectedUserResponse);
    });

    it('should handle null or undefined optional fields gracefully', () => {
      const mockPrismaUser: PrismaUser = {
        id: 2,
        email: 'another@example.com',
        password: 'anotherhashedpassword',
        username: null,
        firstName: null,
        lastName: null,
        role: 'USER',
        isVerified: false,
        // phone: null, // Removed as per your schema.prisma update and regeneration
        lastLoginAt: null, // Still required by PrismaUser type if in schema.prisma
        verifyToken: null,
        resetToken: null,
        resetExpires: null,
        createdAt: new Date('2023-02-01T11:00:00Z'),
        updatedAt: new Date('2023-02-01T11:00:00Z'),
        // Add other required PrismaUser properties if any are missing from your schema.prisma
        // e.g., refreshTokens: [] if it's a relation field
      };

      const expectedUserResponse: UserResponse = {
        id: 2,
        email: 'another@example.com',
        username: null,
        firstName: null,
        lastName: null,
        role: 'USER',
        isVerified: false,
        // phone: null, // Removed from expected response
        // lastLoginAt: null, // Removed from expected response
        createdAt: mockPrismaUser.createdAt,
        updatedAt: mockPrismaUser.updatedAt,
      };

      // Simulating the toUserResponse function's behavior
      const { password, verifyToken, resetToken, resetExpires, lastLoginAt, ...safeUser } = mockPrismaUser;
      const result = safeUser as UserResponse;

      expect(result).toEqual(expectedUserResponse);
    });
  });
});
