import { z } from 'zod';
import { addDays, isValidDateKey } from '../../utils/dates.js';

const dateKey = z.string().refine(isValidDateKey, 'Data inválida (use AAAA-MM-DD).');
const MAX_RANGE_DAYS = 400;

export const attendanceQuerySchema = z
  .object({ from: dateKey, to: dateKey })
  .refine((query) => query.from <= query.to, 'from deve ser anterior a to.')
  .refine((query) => addDays(query.from, MAX_RANGE_DAYS) >= query.to, `O período pode ter no máximo ${MAX_RANGE_DAYS} dias.`);
