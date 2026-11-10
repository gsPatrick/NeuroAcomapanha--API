import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

let client;

// Cliente único, criado na primeira chamada (a API sobe mesmo sem chave; só a geração de relatório exige).
export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    throw new AppError(503, 'OPENAI_NOT_CONFIGURED', 'A chave da OpenAI (OPENAI_API_KEY) não está configurada no servidor.');
  }
  client ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL || undefined,
    timeout: env.OPENAI_TIMEOUT_MS,
    maxRetries: env.OPENAI_MAX_RETRIES, // o SDK já refaz em 408/409/429/5xx com espera crescente
  });
  return client;
}
