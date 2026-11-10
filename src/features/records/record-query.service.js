import { Op } from 'sequelize';
import { DailyRecord } from '../../models/index.js';
import { AppError } from '../../utils/app-error.js';
import { getOwnedChild } from '../children/children.service.js';

export async function getRecord(userId, childId, date) {
  const child = await getOwnedChild(userId, childId);
  const record = await DailyRecord.findOne({ where: { childId: child.id, date } });
  if (!record) throw AppError.notFound('Ainda não há registro nesse dia.', 'RECORD_NOT_FOUND');
  return record;
}

export async function listRecords(userId, childId, { from, to }) {
  const child = await getOwnedChild(userId, childId);
  return DailyRecord.findAll({ where: { childId: child.id, date: { [Op.between]: [from, to] } }, order: [['date', 'ASC']] });
}
