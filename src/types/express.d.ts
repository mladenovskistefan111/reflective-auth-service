declare namespace Express {
    export interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }