import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { childIdParamsSchema } from '../children/children.schema.js';
import { finish, getOne, list, reopen, save, suspend } from './records.controller.js';
import { listRecordsQuerySchema, recordParamsSchema, suspendRecordSchema, upsertRecordSchema } from './records.schema.js';

// Montado em /v1/children/:childId/records
export const recordsRoutes = Router({ mergeParams: true });
recordsRoutes.use(requireAuth);

recordsRoutes.get('/', validate({ params: childIdParamsSchema, query: listRecordsQuerySchema }), list);
recordsRoutes.get('/:date', validate({ params: recordParamsSchema }), getOne);
recordsRoutes.put('/:date', validate({ params: recordParamsSchema, body: upsertRecordSchema }), save);
recordsRoutes.post('/:date/finish', validate({ params: recordParamsSchema }), finish);
recordsRoutes.post('/:date/suspend', validate({ params: recordParamsSchema, body: suspendRecordSchema }), suspend);
recordsRoutes.post('/:date/reopen', validate({ params: recordParamsSchema }), reopen);
