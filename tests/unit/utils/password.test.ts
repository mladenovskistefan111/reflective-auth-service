jest.mock('argon2', () => ({
    hash: jest.fn().mockImplementation((password) =>
        Promise.resolve(`$argon2id$v=19$m=65536,t=3,p=1$somesalt456789$somegeneratedhashvaluehere12345`)
    ),
    verify: jest.fn().mockResolvedValue(false),
    argon2id: 0,
    argon2i: 1,
    argon2d: 2
}));

import { hashPassword, verifyPassword } from '../../../src/utils/password';
import * as argon2 from 'argon2';

const testPassword = 'MySecurePassword123!';
let hashedPassword = '';

describe('password utility functions', () => {
    beforeAll(async () => {
        hashedPassword = await hashPassword(testPassword);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (argon2.verify as jest.Mock).mockResolvedValue(false);
    });

    describe('hashPassword', () => {
        it('should return a hashed string that is different from the original password', async () => {
            hashedPassword = await hashPassword(testPassword);

            expect(hashedPassword).not.toBe(testPassword);
            expect(typeof hashedPassword).toBe('string');
            expect(hashedPassword.length).toBeGreaterThan(0);
            expect(argon2.hash).toHaveBeenCalled();
        });

        it('should produce a valid Argon2 hash format', async () => {
            expect(hashedPassword).toMatch(/^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
        });

        it('should use argon2id variant for hashing', async () => {
            await hashPassword(testPassword);
            expect(argon2.hash).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: argon2.argon2id
                })
            );
        });

        it('should use proper memory, time cost and parallelism settings', async () => {
            await hashPassword(testPassword);
            expect(argon2.hash).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    memoryCost: 2 ** 16,
                    timeCost: 3,
                    parallelism: 1
                })
            );
        });

        it('should handle empty passwords', async () => {
            const emptyPasswordHash = await hashPassword('');
            expect(typeof emptyPasswordHash).toBe('string');
            expect(emptyPasswordHash.length).toBeGreaterThan(0);
            expect(argon2.hash).toHaveBeenCalled();
        });

        it('should handle errors from argon2.hash', async () => {
            (argon2.hash as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Mock hashing error');
            });

            await expect(hashPassword(testPassword)).rejects.toThrow('Mock hashing error');
        });
    });

    describe('verifyPassword', () => {
        it('should return true for a correct password', async () => {
            (argon2.verify as jest.Mock).mockResolvedValue(true);
            const result = await verifyPassword(testPassword, hashedPassword);
            expect(result).toBe(true);
            expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, testPassword);
        });

        it('should return false for an incorrect password', async () => {
            const result = await verifyPassword('WrongPassword123!', hashedPassword);
            expect(result).toBe(false);
            expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, 'WrongPassword123!');
        });

        it('should return false for an empty password', async () => {
            const result = await verifyPassword('', hashedPassword);
            expect(result).toBe(false);
            expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, '');
        });

        it('should return false for an invalid hash (format check)', async () => {
            const invalidHash = 'notAValidHash';
            const result = await verifyPassword(testPassword, invalidHash);
            expect(result).toBe(false);
            expect(argon2.verify).not.toHaveBeenCalled();
        });

        it('should return false if hash is null', async () => {
            const result = await verifyPassword(testPassword, null as unknown as string);
            expect(result).toBe(false);
            expect(argon2.verify).not.toHaveBeenCalled();
        });

        it('should return false if hash is undefined', async () => {
            const result = await verifyPassword(testPassword, undefined as unknown as string);
            expect(result).toBe(false);
            expect(argon2.verify).not.toHaveBeenCalled();
        });

        it('should return false for hash with wrong prefix', async () => {
            const wrongPrefixHash = 'wrongprefix$hash$value';
            const result = await verifyPassword(testPassword, wrongPrefixHash);
            expect(result).toBe(false);
            expect(argon2.verify).not.toHaveBeenCalled();
        });

        it('should return false if argon2.verify throws an unexpected error', async () => {
            (argon2.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Argon2 internal verification error');
            });

            const mockHash = '$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$ZmFrZWhhc2g';
            const result = await verifyPassword(testPassword, mockHash);

            expect(result).toBe(false);
            expect(argon2.verify).toHaveBeenCalledWith(mockHash, testPassword);
        });
    });
});