import 'dotenv/config';
import { z } from 'zod';

// Variáveis de ambiente validadas uma única vez. O resto do código importa `env` daqui (nunca process.env direto).
const bool = (fallback) =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  DB_SSL: bool('false'),
  DB_LOGGING: bool('false'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(6).default(2),
  OPENAI_BASE_URL: z.string().optional().default(''),

  AUTO_GENERATE_REPORT: bool('true'),
  REPORTS_STORAGE_DIR: z.string().default('./storage/reports'),
  REPORT_LOGO_PATH: z.string().optional().default(''),
  // Cabeçalho fixo do documento (igual ao original): não é preenchido no app.
  REPORT_SCHOOL_NAME: z.string().default('Soma Garden'),
  REPORT_MONITOR_NAME: z.string().default('Diana Souza'),
  REPORT_SUPERVISOR_NAME: z.string().default('Isabela Navarro'),
  SOFFICE_BIN: z.string().default('soffice'),
  SOFFICE_TIMEOUT_MS: z.coerce.number().int().positive().default(90000),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
  console.error(`Variáveis de ambiente inválidas:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
