import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { list } from './attendance.controller.js';
import { attendanceQuerySchema } from './attendance.schema.js';

// Montado em /v1/attendance
export const attendanceRoutes = Router();
attendanceRoutes.use(requireAuth);

attendanceRoutes.get('/', validate({ query: attendanceQuerySchema }), list);
