import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { create, getOne, list, remove, sync, update } from './children.controller.js';
import { childIdParamsSchema, createChildSchema, syncChildrenSchema, updateChildSchema } from './children.schema.js';

export const childrenRoutes = Router();
childrenRoutes.use(requireAuth);

childrenRoutes.get('/', list);
childrenRoutes.put('/', validate({ body: syncChildrenSchema }), sync);
childrenRoutes.post('/', validate({ body: createChildSchema }), create);
childrenRoutes.get('/:childId', validate({ params: childIdParamsSchema }), getOne);
childrenRoutes.patch('/:childId', validate({ params: childIdParamsSchema, body: updateChildSchema }), update);
childrenRoutes.delete('/:childId', validate({ params: childIdParamsSchema }), remove);

