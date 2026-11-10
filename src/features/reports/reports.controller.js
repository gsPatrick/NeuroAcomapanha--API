import { createLogger } from '../../utils/logger.js';
import { catchAsync } from '../../utils/catch-async.js';
import { sendData } from '../../utils/http-response.js';
import { mondayOf } from '../../utils/dates.js';
import { getOwnedChild } from '../children/children.service.js';
import { runReport, startReport } from './report-generate.service.js';
import { getReport, getReportFile, listReports } from './report-query.service.js';

const log = createLogger('download');

export const list = catchAsync(async (req, res) => sendData(res, await listReports(req.user.id, req.params.childId)));
export const getOne = catchAsync(async (req, res) => sendData(res, await getReport(req.user.id, req.params.childId, req.params.weekStart)));

// Manual: começa a gerar e responde 202 na hora; o app acompanha o status em GET /:weekStart.
export const generate = catchAsync(async (req, res) => {
  const child = await getOwnedChild(req.user.id, req.params.childId);
  const report = await startReport(child.id, mondayOf(req.body.weekStart));
  runReport(report.id); // segundo plano; runReport nunca lança
  sendData(res, report, 202);
});

export const download = catchAsync(async (req, res) => {
  const file = await getReportFile(req.user.id, req.params.childId, req.params.weekStart, req.valid.query.format);
  log.info(`Entregando ${file.fileName} (${(file.buffer.length / 1024).toFixed(1)} KB).`, { formato: req.valid.query.format });
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.send(file.buffer);
});
