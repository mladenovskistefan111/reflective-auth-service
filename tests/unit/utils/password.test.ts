// tests/unit/utils/password.test.ts

// Mock argon2 module BEFORE importing anything else
jest.mock('argon2', () => {
    return {
      // Use a factory function to create the named exports
      default: jest.fn(),
      hash: jest.fn().mockImplementation((password) => 
        Promise.resolve(`$argon2id$v=19$m=65536,t=3,p=1$somesalt456789$somegeneratedhashvaluehere12345`)
      ),
      verify: jest.fn().mockResolvedValue(false),
      argon2id: 0, // Mock the argon2id constant
      argon2i: 1,  // Additional constants that might be needed
      argon2d: 2   // Additional constants that might be needed
    };
  });
  
  // Now import the functions from your utility file
  import { hashPassword, verifyPassword } from '@utils/password';
  import * as argon2 from 'argon2'; // Import the mocked module
  
  const testPassword = 'MySecurePassword123!';
  let hashedPassword = '';
  
  describe('password utility functions', () => {
    // Before all tests in this suite, generate a hashed password using the mocked hashPassword
    beforeAll(async () => {
      hashedPassword = await hashPassword(testPassword);
    });
  
    // Reset mocks before each test to ensure isolation
    beforeEach(() => {
      jest.clearAllMocks(); // Clear mock calls and reset their behavior
      // Set the default mock behavior for argon2.verify to RESOLVE FALSE.
      (argon2.verify as jest.Mock).mockResolvedValue(false);
    });
  
    describe('hashPassword', () => {
      it('should return a hashed string that is different from the original password', async () => {
        // Reset the hashedPassword to ensure this test actually calls argon2.hash
        hashedPassword = await hashPassword(testPassword);
        
        expect(hashedPassword).not.toBe(testPassword);
        expect(typeof hashedPassword).toBe('string');
        expect(hashedPassword.length).toBeGreaterThan(0);
        expect(argon2.hash).toHaveBeenCalled(); // This should now pass!
      });
  
      it('should produce a valid Argon2 hash format', async () => {
        // Argon2 hashes typically start with $argon2id$ and have specific structure
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
            memoryCost: 2 ** 16, // 64 MiB
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
        // Mock argon2.hash to throw an error for this test
        (argon2.hash as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Mock hashing error');
        });
        
        await expect(hashPassword(testPassword)).rejects.toThrow('Mock hashing error');
      });
    });
  
    describe('verifyPassword', () => {
      it('should return true for a correct password', async () => {
        // OVERRIDE default: For this specific test, set mock to resolve TRUE
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        const result = await verifyPassword(testPassword, hashedPassword);
        expect(result).toBe(true);
        expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, testPassword);
      });
  
      it('should return false for an incorrect password', async () => {
        // Default mock behavior is already false, so no explicit override needed
        const result = await verifyPassword('WrongPassword123!', hashedPassword);
        expect(result).toBe(false);
        expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, 'WrongPassword123!');
      });
  
      it('should return false for an empty password', async () => {
        // Default mock behavior is already false, so no explicit override needed
        const result = await verifyPassword('', hashedPassword);
        expect(result).toBe(false);
        // Ensure argon2.verify was called with the empty password, as the early exit check is for hash format.
        expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, '');
      });
  
      it('should return false for an invalid hash (format check)', async () => {
        const invalidHash = 'notAValidHash';
        const result = await verifyPassword(testPassword, invalidHash);
        expect(result).toBe(false);
        // Ensure argon2.verify was NOT called because of the early exit check in verifyPassword
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
  
      // This test case covers the catch block in verifyPassword
      it('should return false if argon2.verify throws an unexpected error', async () => {
        // Mock argon2.verify to throw an error for this specific test
        (argon2.verify as jest.Mock).mockImplementation(() => {
          throw new Error('Argon2 internal verification error');
        });
  
        // Provide a seemingly valid (but mock-failing) hash format
        const mockHash = '$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$ZmFrZWhhc2g';
        const result = await verifyPassword(testPassword, mockHash);
  
        expect(result).toBe(false);
        expect(argon2.verify).toHaveBeenCalledWith(mockHash, testPassword);
      });
    });
  });