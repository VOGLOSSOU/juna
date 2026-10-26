import { Request, Response, NextFunction } from 'express';

// Une réponse contenant les favoris d'un compte ne doit pas être mise en cache public.
export const personalizeResponse = (req: Request, res: Response, next: NextFunction): void => {
  res.vary('Authorization');
  if (req.user) res.set('Cache-Control', 'private, no-store');
  next();
};
