import { UserRole } from '@prisma/client';

// Extension des types Express pour ajouter l'utilisateur au Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};