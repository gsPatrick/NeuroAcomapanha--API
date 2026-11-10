import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('E-mail inválido.');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe o nome completo.').max(160),
  email,
  password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.').max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.').max(100),
});

// Só o que a AT pode mudar no próprio perfil (e-mail e senha ficam de fora).
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    role: z.string().trim().min(1).max(120),
    photo: z.string().max(600000).nullable(),
    avatar: z.record(z.string().max(30), z.string().max(30)).nullable(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Envie ao menos um campo.');
