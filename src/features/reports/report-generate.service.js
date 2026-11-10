import path from 'node:path';
import { env } from '../../config/env.js';
import { Child, User, WeeklyReport } from '../../models/index.js';
import { buildWeeklyReportDocx } from '../../providers/docx/weekly-report.docx.js';
import { convertDocxToPdf } from '../../providers/libreoffice/pdf-converter.js';
import { saveFile } from '../../providers/storage/local-storage.js';
import { AppError } from '../../utils/app-error.js';
import { createLogger, startTimer, withLogContext } from '../../utils/logger.js';
import { firstName } from '../../utils/text.js';
import { buildReportContent } from './report-content.service.js';
import { loadWeekRecords } from './report-week.service.js';
import { STALE_GENERATING_MS } from './reports.constants.js';

const log = createLogger('relatório');
const inFlight = new Set();
const kb = (buffer) => `${(buffer.length / 1024).toFixed(1)} KB`;

// Deixa o relatório no estado "gerando" (ou recusa se já há uma geração em andamento). Rápido: pode ser chamado na requisição.
export async function startReport(childId, weekStart) {
  const key = `${childId}:${weekStart}`;
  const existing = await WeeklyReport.findOne({ where: { childId, weekStart } });
  const running = inFlight.has(key) || (existing?.status === 'generating' && Date.now() - existing.updatedAt.getTime() < STALE_GENERATING_MS);
  if (running) {
    log.warn('Pedido recusado: esse relatório já está sendo gerado.', { semana: weekStart, aluno: childId.slice(0, 8) });
    throw AppError.conflict('Esse relatório já está sendo gerado.', 'REPORT_IN_PROGRESS');
  }

  const values = { status: 'generating', errorMessage: null };
  const report = existing ? await existing.update(values) : await WeeklyReport.create({ childId, weekStart, ...values });
  inFlight.add(key);
  log.info(existing ? `Relatório ${weekStart} será GERADO DE NOVO (anterior: ${existing.status}).` : `Relatório ${weekStart} registrado como "gerando".`, { rel: report.id.slice(0, 6), aluno: childId.slice(0, 8) });
  return report;
}

// Faz o trabalho pesado: redige (IA), monta o DOCX, converte para PDF e grava. Nunca lança: falha vira status "failed".
// Todas as linhas de log de dentro levam o código `rel` do relatório, para seguir uma geração do começo ao fim.
export async function runReport(reportId) {
  const report = await WeeklyReport.findByPk(reportId);
  if (!report) return null; // apagado (ex.: aluno removido) antes de começar
  // O sufixo muda a cada execução: gerar a mesma semana de novo não mistura as linhas das duas execuções.
  return withLogContext({ rel: `${report.id.slice(0, 6)}.${Math.random().toString(36).slice(2, 5)}` }, () => generate(report));
}

async function generate(report) {
  const key = `${report.childId}:${report.weekStart}`;
  const total = startTimer();
  try {
    const child = await Child.findByPk(report.childId, { include: [{ model: User, as: 'user' }] });
    const records = await loadWeekRecords(child.id, report.weekStart);
    log.info(`▶ INÍCIO da geração: ${firstName(child.name)}, semana ${report.weekStart}.`, {
      dias: records.map((record) => `${record.date.slice(5)}:${record.status}`).join(' '),
      modelo: env.OPENAI_MODEL,
      debug: env.REPORT_DEBUG ? 'ligado (texto da IA aparece no log)' : 'desligado',
    });
    if (!records.some((record) => record.status === 'finished')) {
      throw AppError.badRequest('Não há nenhum dia finalizado nessa semana.', 'WEEK_EMPTY');
    }

    log.info('1/4 Redigindo o conteúdo (leitura dos dias + IA)…');
    let step = startTimer();
    const content = await buildReportContent({ child, user: child.user, weekStart: report.weekStart, records });
    log.info(`1/4 Conteúdo pronto em ${step()}.`, {
      periodo: content.header.period,
      dias: content.days.length,
      etapas: content.days.reduce((sum, day) => sum + day.stages.length, 0),
      ocorrencias: content.behaviors.length,
      paciente: content.header.patient,
      aplicadora: content.header.applicator,
    });

    log.info('2/4 Montando o documento Word (DOCX)…');
    step = startTimer();
    const docx = await buildWeeklyReportDocx(content);
    log.info(`2/4 DOCX pronto em ${step()}.`, { tamanho: kb(docx) });

    log.info('3/4 Convertendo para PDF (LibreOffice)…');
    step = startTimer();
    const pdf = await convertDocxToPdf(docx);
    log.info(`3/4 PDF pronto em ${step()}.`, { tamanho: kb(pdf) });

    log.info('4/4 Gravando os arquivos…');
    const base = path.posix.join(child.id, `relatorio-${report.weekStart}`);
    await saveFile(`${base}.docx`, docx);
    await saveFile(`${base}.pdf`, pdf);
    await report.update({ status: 'ready', content, docxPath: `${base}.docx`, pdfPath: `${base}.pdf`, model: env.OPENAI_MODEL, generatedAt: new Date(), errorMessage: null });
    log.info(`✔ RELATÓRIO PRONTO em ${total()}.`, { pdf: `${base}.pdf`, docx: `${base}.docx` });
  } catch (error) {
    const known = error instanceof AppError;
    log.error(`✖ FALHOU depois de ${total()}: ${error.code ?? 'ERRO_INESPERADO'} — ${error.message}`);
    if (!known) log.error(`Detalhe técnico: ${error.stack}`);
    await report.update({ status: 'failed', errorMessage: known ? `${error.code}: ${error.message}` : 'Erro inesperado ao gerar o relatório.' });
  } finally {
    inFlight.delete(key);
  }
  return report;
}
