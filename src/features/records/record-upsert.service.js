import { DailyRecord } from '../../models/index.js';
import { AppError } from '../../utils/app-error.js';
import { getOwnedChild } from '../children/children.service.js';

// Grava o dia inteiro (é o que o app já faz: manda o registro completo a cada mudança).
// Não muda o status: fechar o dia é uma ação explícita (record-status.service).
export async function upsertRecord(userId, childId, date, data) {
  const child = await getOwnedChild(userId, childId);
  const existing = await DailyRecord.findOne({ where: { childId: child.id, date } });

  if (existing?.status === 'suspended') {
    throw AppError.conflict('Esse dia está marcado como atendimento suspenso. Reabra o dia para registrar.', 'RECORD_SUSPENDED');
  }
  if (existing) return existing.update(data);
  return DailyRecord.create({ ...data, childId: child.id, date });
}
