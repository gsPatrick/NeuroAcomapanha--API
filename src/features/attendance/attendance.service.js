import { Op } from 'sequelize';
import { Child, DailyRecord } from '../../models/index.js';

// O registro tem conteúdo? (marcação, anotação, resposta da prancheta ou resumo preenchido)
const hasContent = (record) =>
  record.events.length > 0 ||
  Object.keys(record.answers ?? {}).length > 0 ||
  Object.values(record.summary ?? {}).some((text) => String(text).trim());

// Visão leve de todos os alunos da AT num período (calendário, agenda e números do mês), sem o conteúdo dos registros:
// [{ childId, date, status: 'open' | 'finished' | 'suspended', filled }]. `filled` diz se um dia ainda aberto já tem algo registrado.
export async function listAttendance(userId, { from, to }) {
  const children = await Child.findAll({ where: { userId }, attributes: ['id'] });
  if (!children.length) return [];

  const records = await DailyRecord.findAll({
    where: { childId: children.map((child) => child.id), date: { [Op.between]: [from, to] } },
    attributes: ['childId', 'date', 'status', 'events', 'answers', 'summary'],
    order: [['date', 'ASC']],
  });
  return records.map((record) => ({ childId: record.childId, date: record.date, status: record.status, filled: hasContent(record) }));
}
