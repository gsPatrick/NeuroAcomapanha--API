import path from 'node:path';
import { env } from '../../config/env.js';
import { Child, User, WeeklyReport } from '../../models/index.js';
import { buildWeeklyReportDocx } from '../../providers/docx/weekly-report.docx.js';
import { convertDocxToPdf } from '../../providers/libreoffice/pdf-converter.js';
import { saveFile } from '../../providers/storage/local-storage.js';
import { AppError } from '../../utils/app-error.js';
import { buildReportContent } from './report-content.service.js';
import { loadWeekRecords } from './report-week.service.js';
import { STALE_GENERATING_MS } from './reports.constants.js';

const inFlight = new Set();

// Deixa o relatório no estado "gerando" (ou recusa se já há uma geração em andamento). Rápido: pode ser chamado na requisição.
export async function startReport(childId, weekStart) {
  const key = `${childId}:${weekStart}`;
  const existing = await WeeklyReport.findOne({ where: { childId, weekStart } });
  const running = inFlight.has(key) || (existing?.status === 'generating' && Date.now() - existing.updatedAt.getTime() < STALE_GENERATING_MS);
  if (running) throw AppError.conflict('Esse relatório já está sendo gerado.', 'REPORT_IN_PROGRESS');

  const values = { status: 'generating', errorMessage: null };
  const report = existing ? await existing.update(values) : await WeeklyReport.create({ childId, weekStart, ...values });
  inFlight.add(key);
  return report;
}

// Faz o trabalho pesado: redige (IA), monta o DOCX, converte para PDF e grava. Nunca lança: falha vira status "failed".
export async function runReport(reportId) {
  const report = await WeeklyReport.findByPk(reportId);
  if (!report) return null; // apagado (ex.: aluno removido) antes de começar
  const key = `${report.childId}:${report.weekStart}`;
  try {
    const child = await Child.findByPk(report.childId, { include: [{ model: User, as: 'user' }] });
    const records = await loadWeekRecords(child.id, report.weekStart);
    if (!records.some((record) => record.status === 'finished')) {
      throw AppError.badRequest('Não há nenhum dia finalizado nessa semana.', 'WEEK_EMPTY');
    }

    const content = await buildReportContent({ child, user: child.user, weekStart: report.weekStart, records });
    const docx = await buildWeeklyReportDocx(content);
    const pdf = await convertDocxToPdf(docx);

    const base = path.posix.join(child.id, `relatorio-${report.weekStart}`);
    await saveFile(`${base}.docx`, docx);
    await saveFile(`${base}.pdf`, pdf);
    await report.update({ status: 'ready', content, docxPath: `${base}.docx`, pdfPath: `${base}.pdf`, model: env.OPENAI_MODEL, generatedAt: new Date(), errorMessage: null });
  } catch (error) {
    console.error('[report] falhou:', error.code ?? '', error.message);
    await report.update({ status: 'failed', errorMessage: error instanceof AppError ? `${error.code}: ${error.message}` : 'Erro inesperado ao gerar o relatório.' });
  } finally {
    inFlight.delete(key);
  }
  return report;
}
