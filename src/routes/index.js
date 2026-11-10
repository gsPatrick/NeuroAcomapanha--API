import { Router } from 'express';
import { attendanceRoutes } from '../features/attendance/attendance.routes.js';
import { authRoutes } from '../features/auth/auth.routes.js';
import { childrenRoutes } from '../features/children/children.routes.js';
import { recordsRoutes } from '../features/records/records.routes.js';
import { reportsRoutes } from '../features/reports/reports.routes.js';

// Único agregador de rotas da versão atual (v1).
export const router = Router();

const ping = (_req, res) => res.json({ data: { status: 'ok', version: 'v1', time: new Date().toISOString() } });
router.get('/health', ping);
router.get('/v1/ping', ping);

router.use('/v1/auth', authRoutes);
router.use('/v1/attendance', attendanceRoutes);
router.use('/v1/children', childrenRoutes);
router.use('/v1/children/:childId/records', recordsRoutes);
router.use('/v1/children/:childId/reports', reportsRoutes);
