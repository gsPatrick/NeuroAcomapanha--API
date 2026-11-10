import { z } from 'zod';
import { isValidDateKey } from '../../utils/dates.js';
import { childIdParamsSchema } from '../children/children.schema.js';
import { BLOCK_KINDS } from './records.constants.js';

const dateKey = z.string().refine(isValidDateKey, 'Data inválida (use AAAA-MM-DD).');

export const recordParamsSchema = childIdParamsSchema.extend({ date: dateKey });

export const listRecordsQuerySchema = z.object({ from: dateKey, to: dateKey }).refine((q) => q.from <= q.to, 'from deve ser anterior a to.');

const blockSchema = z.object({
  id: z.string().min(1).max(60),
  kind: z.enum(BLOCK_KINDS).default('other'),
  title: z.string().trim().min(1).max(120),
  // Texto que a AT já escreveu à mão: quando existe, a IA não reescreve esse momento.
  observed: z.string().trim().max(3000).optional(),
  goals: z.array(z.string().trim().min(1).max(300)).max(8).optional(),
});

const eventSchema = z.object({
  id: z.string().min(1).max(80),
  blockId: z.string().min(1).max(60),
  key: z.string().min(1).max(60), // marcação rápida ou 'note'
  at: z.number().int().positive(), // epoch em ms
  text: z.string().trim().max(3000).optional(),
  antecedent: z.string().trim().max(500).optional(), // reservado: o relatório não preenche a tabela de comportamentos
  consequence: z.string().trim().max(500).optional(),
});

const answerSchema = z.object({ answer: z.string().max(200).nullable().optional(), obs: z.string().trim().max(3000).optional() });

export const upsertRecordSchema = z.object({
  blocks: z.array(blockSchema).max(30),
  events: z.array(eventSchema).max(500).default([]),
  answers: z.record(z.string(), z.record(z.string(), answerSchema)).default({}),
  summary: z.record(z.string(), z.string().max(3000)).default({}),
  cursor: z.string().max(60).nullable().optional(), // momento em que a AT parou
});

export const suspendRecordSchema = z.object({ note: z.string().trim().min(1).max(300).optional() });
