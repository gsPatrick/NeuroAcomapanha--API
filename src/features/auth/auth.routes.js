import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { login, me, register, updateMe } from './auth.controller.js';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schema.js';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerSchema }), register);
authRoutes.post('/login', validate({ body: loginSchema }), login);
authRoutes.get('/me', requireAuth, me);
authRoutes.patch('/me', requireAuth, validate({ body: updateProfileSchema }), updateMe);
