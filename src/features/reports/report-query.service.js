import { WeeklyReport } from '../../models/index.js';
import { fileExists, readFile } from '../../providers/storage/local-storage.js';
import { AppError } from '../../utils/app-error.js';
import { mondayOf } from '../../utils/dates.js';
import { getOwnedChild } from '../children/children.service.js';

export async function listReports(userId, childId) {
  const child = await getOwnedChild(userId, childId);
  return WeeklyReport.findAll({ where: { childId: child.id }, attributes: { exclude: ['content'] }, order: [['weekStart', 'DESC']] });
}

export async function getReport(userId, childId, weekStart) {
  const child = await getOwnedChild(userId, childId);
  const report = await WeeklyReport.findOne({ where: { childId: child.id, weekStart: mondayOf(weekStart) } });
  if (!report) throw AppError.notFound('Relatório dessa semana ainda não foi gerado.', 'REPORT_NOT_FOUND');
  return report;
}

// Arquivo pronto para baixar: { buffer, contentType, fileName }.
export async function getReportFile(userId, childId, weekStart, format) {
  const report = await getReport(userId, childId, weekStart);
  const relativePath = format === 'pdf' ? report.pdfPath : report.docxPath;
  if (report.status !== 'ready' || !relativePath || !(await fileExists(relativePath))) {
    throw AppError.conflict('O arquivo ainda não está pronto.', 'REPORT_NOT_READY');
  }
  return {
    buffer: await readFile(relativePath),
    contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileName: `RELATORIO-ESCOLAR-${report.weekStart}.${format}`,
  };
}
