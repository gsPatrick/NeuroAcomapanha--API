import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

// Exige "Authorization: Bearer <token>" e coloca { id } em req.user.
export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(AppError.unauthorized('Token ausente.', 'TOKEN_MISSING'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(AppError.unauthorized('Token inválido ou expirado.', 'TOKEN_INVALID'));
  }
};
