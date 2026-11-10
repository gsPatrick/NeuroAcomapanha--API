import { Op } from 'sequelize';
import { DailyRecord } from '../../models/index.js';
import { weekDates, weekdayOf } from '../../utils/dates.js';
import { DEFAULT_WEEKDAYS } from './reports.constants.js';

// Dias (AAAA-MM-DD) em que a AT atende nessa semana, segundo a rotina do aluno. Sem rotina, segunda a sexta.
export function attendanceDates(child, weekStart) {
  const days = weekDates(weekStart);
  const withRoutine = days.filter((date) => child.routine?.[weekdayOf(date)]?.attends);
  return withRoutine.length ? withRoutine : days.filter((date) => DEFAULT_WEEKDAYS.includes(weekdayOf(date)));
}

export const loadWeekRecords = (childId, weekStart) => {
  const days = weekDates(weekStart);
  return DailyRecord.findAll({ where: { childId, date: { [Op.between]: [days[0], days[6]] } }, order: [['date', 'ASC']] });
};

// A semana está pronta quando todos os dias de atendimento foram fechados (ou suspensos) e ao menos um teve atendimento.
export function isWeekComplete(child, weekStart, records) {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const dates = attendanceDates(child, weekStart);
  const allClosed = dates.every((date) => ['finished', 'suspended'].includes(byDate.get(date)?.status));
  return allClosed && dates.some((date) => byDate.get(date)?.status === 'finished');
}
