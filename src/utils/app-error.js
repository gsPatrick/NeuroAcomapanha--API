// Erro de negócio/HTTP com status e `code` estáveis para o cliente.
export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new AppError(400, code, message, details);
  }
  static unauthorized(message = 'Não autenticado.', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }
  static notFound(message = 'Não encontrado.', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }
  static conflict(message, code = 'CONFLICT') {
    return new AppError(409, code, message);
  }
}
