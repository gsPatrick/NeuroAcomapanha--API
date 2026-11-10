import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

// Único ponto de saída de erros: { error: { code, message, details? } }.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON inválido no corpo da requisição.' } });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Corpo da requisição grande demais.' } });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: env.NODE_ENV === 'production' ? 'Erro interno.' : error.message },
  });
};
