// Repassa erros de handlers async para o middleware de erro.
export const catchAsync = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
