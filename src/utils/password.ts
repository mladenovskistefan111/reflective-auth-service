// src/utils/password.ts
import * as argon2 from 'argon2';

/**
 * Hash password using Argon2 (more secure than bcrypt)
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id, // Most secure variant
    memoryCost: 2 ** 16,   // 64 MiB
    timeCost: 3,           // 3 iterations
    parallelism: 1         // 1 thread
  });
};

/**
 * Verify password against hash
 *
 * This function now gracefully handles invalid hash formats by returning false
 * instead of throwing an error when the hash string is malformed.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Add this check to handle invalid hash formats gracefully
  // If the hash is not a string, is empty, or doesn't start with '$argon2', it's invalid.
  if (!hash || typeof hash !== 'string' || !hash.startsWith('$argon2')) {
    return false;
  }
  
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // argon2.verify might throw an error for other reasons (e.g., hash too short, corrupted,
    // or verification failure for valid format but wrong password).
    // In any such error case, we want to treat it as a failed verification.
    return false;
  }
};