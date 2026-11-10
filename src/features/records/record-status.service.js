import { DailyRecord } from '../../models/index.js';
import { AppError } from '../../utils/app-error.js';
import { getOwnedChild } from '../children/children.service.js';
import { triggerReportIfWeekComplete } from '../reports/report-trigger.service.js';
import { DEFAULT_SUSPENSION_NOTE } from './records.constants.js';

async function findOrCreate(childId, date) {
  const [record] = await DailyRecord.findOrCreate({ where: { childId, date }, defaults: { childId, date } });
  return record;
}

// Fecha o dia. Se esse era o último dia de atendimento da semana, o relatório sai sozinho (em segundo plano).
// Devolve { record, weekReport }: weekReport = { weekStart, status } quando a geração começou, senão null.
export async function finishRecord(userId, childId, date) {
  const child = await getOwnedChild(userId, childId);
  const record = await DailyRecord.findOne({ where: { childId: child.id, date } });
  if (!record || record.blocks.length === 0) {
    throw AppError.badRequest('Registre ao menos um momento do dia antes de finalizar.', 'RECORD_EMPTY');
  }
  await record.update({ status: 'finished', finishedAt: new Date(), suspensionNote: null });
  return { record, weekReport: await triggerReportIfWeekComplete(child, date) };
}

export async function suspendRecord(userId, childId, date, { note }) {
  const child = await getOwnedChild(userId, childId);
  const record = await findOrCreate(child.id, date);
  await record.update({ status: 'suspended', suspensionNote: note ?? DEFAULT_SUSPENSION_NOTE, finishedAt: new Date() });
  return { record, weekReport: await triggerReportIfWeekComplete(child, date) };
}

// Volta o dia para "em andamento" (corrigir algo depois de fechado).
export async function reopenRecord(userId, childId, date) {
  const child = await getOwnedChild(userId, childId);
  const record = await DailyRecord.findOne({ where: { childId: child.id, date } });
  if (!record) throw AppError.notFound('Ainda não há registro nesse dia.', 'RECORD_NOT_FOUND');
  return record.update({ status: 'open', finishedAt: null, suspensionNote: null });
}
