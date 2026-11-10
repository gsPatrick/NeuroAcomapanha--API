import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { childIdParamsSchema } from '../children/children.schema.js';
import { download, generate, getOne, list } from './reports.controller.js';
import { downloadQuerySchema, generateReportSchema, reportParamsSchema } from './reports.schema.js';

// Montado em /v1/children/:childId/reports
export const reportsRoutes = Router({ mergeParams: true });
reportsRoutes.use(requireAuth);

reportsRoutes.get('/', validate({ params: childIdParamsSchema }), list);
reportsRoutes.post('/', validate({ params: childIdParamsSchema, body: generateReportSchema }), generate);
reportsRoutes.get('/:weekStart', validate({ params: reportParamsSchema }), getOne);
reportsRoutes.get('/:weekStart/download', validate({ params: reportParamsSchema, query: downloadQuerySchema }), download);
