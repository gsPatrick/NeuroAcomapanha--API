import { AppError } from '../utils/app-error.js';

export const notFoundHandler = (req, _res, next) => next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
