import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

// Valida body/params/query com Zod ANTES do controller. Os valores já validados (com defaults e coerções)
// substituem os originais. Uso: validate({ body: schema, params: schema, query: schema }).
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const value = schemas[part].parse(req[part]);
      // req.query é somente leitura no Express 5: guardamos a versão validada em req.valid.
      req.valid = { ...req.valid, [part]: value };
      if (part !== 'query') req[part] = value;
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
      return next(new AppError(422, 'VALIDATION_ERROR', 'Dados inválidos.', details));
    }
    return next(error);
  }
};
