import { UserResponse } from '../../../src/models/user.model'; 
import { User as PrismaUser } from '@prisma/client';

describe('user.model.ts', () => {
  describe('toUserResponse', () => {
    it('should correctly transform a PrismaUser object into a UserResponse, omitting sensitive fields', () => {
      const mockPrismaUser: PrismaUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword123', 
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
        lastLoginAt: null,
        verifyToken: 'someVerifyToken', 
        resetToken: 'someResetToken',   
        resetExpires: new Date(),      
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
      };

      const expectedUserResponse: UserResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
        createdAt: mockPrismaUser.createdAt,
        updatedAt: mockPrismaUser.updatedAt,
      };

      const { password, verifyToken, resetToken, resetExpires, lastLoginAt, ...safeUser } = mockPrismaUser;
      const result = safeUser as UserResponse;

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('verifyToken');
      expect(result).not.toHaveProperty('resetToken');
      expect(result).not.toHaveProperty('resetExpires');
      expect(result).not.toHaveProperty('lastLoginAt'); 

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
        lastLoginAt: null, 
        verifyToken: null,
        resetToken: null,
        resetExpires: null,
        createdAt: new Date('2023-02-01T11:00:00Z'),
        updatedAt: new Date('2023-02-01T11:00:00Z'),
      };

      const expectedUserResponse: UserResponse = {
        id: 2,
        email: 'another@example.com',
        username: null,
        firstName: null,
        lastName: null,
        role: 'USER',
        isVerified: false,
        createdAt: mockPrismaUser.createdAt,
        updatedAt: mockPrismaUser.updatedAt,
      };

      const { password, verifyToken, resetToken, resetExpires, lastLoginAt, ...safeUser } = mockPrismaUser;
      const result = safeUser as UserResponse;

      expect(result).toEqual(expectedUserResponse);
    });
  });
});
