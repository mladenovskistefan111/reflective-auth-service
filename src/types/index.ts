export interface JwtPayload {
    id: number;
    email: string;
    role: string;
    [key: string]: any;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      email: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string;
    };
  }
  
  export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface UserProfile {
    id: number;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isVerified: boolean;
  }