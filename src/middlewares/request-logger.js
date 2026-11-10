import { env } from '../config/env.js';
import { createLogger, startTimer } from '../utils/logger.js';

const log = createLogger('http');

// Uma linha por requisição: método, caminho, status e tempo. Nunca registra corpo, cabeçalhos nem parâmetros da URL.
export const requestLogger = (req, res, next) => {
  if (!env.LOG_REQUESTS || req.path.endsWith('/health')) return next();
  const elapsed = startTimer();
  const url = req.originalUrl.split('?')[0]; // sem parâmetros da URL
  res.on('finish', () => {
    const line = `${req.method} ${url} → ${res.statusCode} (${elapsed()})`;
    if (res.statusCode >= 500) log.error(line);
    else if (res.statusCode >= 400) log.warn(line);
    else log.info(line);
  });
  return next();
};
