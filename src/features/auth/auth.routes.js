import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  firstPassword,
  login,
  me,
  passkeyLoginOptions,
  passkeyLoginVerify,
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyRemove,
  register,
  updateMe,
} from './auth.controller.js';
import { firstPasswordSchema, loginSchema, passkeyLoginSchema, passkeyRegisterSchema, registerSchema, updateProfileSchema } from './auth.schema.js';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerSchema }), register);
authRoutes.post('/login', validate({ body: loginSchema }), login);
authRoutes.get('/me', requireAuth, me);
authRoutes.patch('/me', requireAuth, validate({ body: updateProfileSchema }), updateMe);
authRoutes.post('/first-password', requireAuth, validate({ body: firstPasswordSchema }), firstPassword);

// Face ID / biometria (WebAuthn)
authRoutes.post('/passkeys/register/options', requireAuth, passkeyRegisterOptions);
authRoutes.post('/passkeys/register/verify', requireAuth, validate({ body: passkeyRegisterSchema }), passkeyRegisterVerify);
authRoutes.post('/passkeys/login/options', passkeyLoginOptions);
authRoutes.post('/passkeys/login/verify', validate({ body: passkeyLoginSchema }), passkeyLoginVerify);
authRoutes.delete('/passkeys', requireAuth, passkeyRemove);
