import { z } from 'zod';
import { isValidDateKey } from '../../utils/dates.js';
import { childIdParamsSchema } from '../children/children.schema.js';
import { REPORT_FORMATS } from './reports.constants.js';

const weekStart = z.string().refine(isValidDateKey, 'Data inválida (use AAAA-MM-DD).');

export const reportParamsSchema = childIdParamsSchema.extend({ weekStart });
// Qualquer dia da semana serve: o relatório é sempre da semana (segunda a domingo) que contém a data.
export const generateReportSchema = z.object({ weekStart });
export const downloadQuerySchema = z.object({ format: z.enum(REPORT_FORMATS).default('pdf') });
