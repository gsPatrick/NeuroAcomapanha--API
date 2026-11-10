import { z } from 'zod';
import { DATE_KEY_REGEX } from '../../utils/dates.js';

export const childIdParamsSchema = z.object({ childId: z.uuid('Id do aluno inválido.') });

const routineDaySchema = z.object({
  attends: z.boolean(),
  welcome: z.boolean().default(false),
  classes: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
});

// Chaves '0'..'6' = Date#getDay (0 = domingo), como no app.
const routineSchema = z.record(z.string().regex(/^[0-6]$/, 'Dia da semana deve ser de 0 a 6.'), routineDaySchema);

const optionalText = (max) => z.string().trim().max(max).optional();

// Foto já recortada pelo app (data URL JPEG, ~50-90 KB). null remove a foto.
const photoSchema = z.string().max(600000).nullable();
// Ilustração do app: { hair, hairColor, skin, clothing, tile } (só textos curtos).
const avatarSchema = z.record(z.string().max(30), z.string().max(30)).nullable();
// Neurodivergências do cadastro: [{ id: 'tea', levels: { suporte: '2' } }].
const conditionsSchema = z
  .array(z.object({ id: z.string().min(1).max(40), levels: z.record(z.string().max(40), z.string().max(40)).default({}) }))
  .max(12);

export const createChildSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(120),
  fullName: optionalText(160),
  schoolName: optionalText(160),
  monitorName: optionalText(160),
  supervisorName: optionalText(160),
  routine: routineSchema.default({}),
  startedAt: z.string().regex(DATE_KEY_REGEX, 'Use AAAA-MM-DD.').optional(),
  photo: photoSchema.optional(),
  avatar: avatarSchema.optional(),
  conditions: conditionsSchema.optional(),
});

export const updateChildSchema = createChildSchema.partial().refine((body) => Object.keys(body).length > 0, 'Envie ao menos um campo.');

// Cadastro completo de uma vez (onboarding do app): `id` conhecido atualiza o aluno; sem id (ou id desconhecido) cria.
// A ordem da lista vira a ordem dos alunos. Quem não estiver na lista é removido (com registros e relatórios).
export const syncChildrenSchema = z.object({
  // routine sem padrão: quem já existe e não manda a rotina mantém a que tinha.
  children: z.array(createChildSchema.extend({ id: z.string().max(80).optional(), routine: routineSchema.optional() })).max(30),
});
