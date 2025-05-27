import * as argon2 from 'argon2';

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id, 
    memoryCost: 2 ** 16,   
    timeCost: 3,           
    parallelism: 1         
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!hash || typeof hash !== 'string' || !hash.startsWith('$argon2')) {
    return false;
  }
  
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
};