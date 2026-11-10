import { env } from '../../config/env.js';
import { createLogger, withLogContext } from '../../utils/logger.js';
import { formatDayHeading, formatDayMonth, weekdayName } from '../../utils/dates.js';
import { DEFAULT_SUSPENSION_NOTE } from '../records/records.constants.js';
import { NARRATIVE_CONCURRENCY } from './reports.constants.js';
import { writeDayStages } from './report-narrative.service.js';
import { attendanceDates } from './report-week.service.js';

const log = createLogger('conteúdo');

// Roda `task` sobre a lista com no máximo `limit` ao mesmo tempo, mantendo a ordem do resultado.
async function mapLimited(list, limit, task) {
  const results = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (next < list.length) {
        const index = next;
        next += 1;
        results[index] = await task(list[index]);
      }
    }),
  );
  return results;
}

// Cada dia roda com o código da data no log (os dias são redigidos ao mesmo tempo e as linhas se misturam).
function buildDay(child, record) {
  return withLogContext({ dia: record.date }, async () => {
    const heading = formatDayHeading(record.date);
    if (record.status === 'suspended') {
      log.info('Dia suspenso: entra no relatório só com a observação, sem passar pela IA.', { observacao: record.suspensionNote ?? DEFAULT_SUSPENSION_NOTE });
      return { heading, note: record.suspensionNote ?? DEFAULT_SUSPENSION_NOTE, stages: [] };
    }
    const stages = await writeDayStages(child, record, weekdayName(record.date));
    log.info(`Dia pronto: ${stages.length} etapa(s) no relatório.`, { etapas: stages.map((stage) => stage.title).join(' | ') });
    return { heading, stages };
  });
}

// Conteúdo final do relatório (texto já redigido). É isto que fica salvo e vira DOCX/PDF.
// A tabela "Registro de Comportamentos Inadequados" NÃO é preenchida pelo sistema: o documento leva a tabela em branco,
// em página própria, para a AT completar à mão.
export async function buildReportContent({ child, user, weekStart, records }) {
  const dates = attendanceDates(child, weekStart);
  const byDate = new Map(records.map((record) => [record.date, record]));
  // Dias sem registro ou ainda abertos ficam de fora; só entram dias fechados ou suspensos.
  const closed = dates.map((date) => byDate.get(date)).filter((record) => record && ['finished', 'suspended'].includes(record.status));

  const ignored = dates.filter((date) => !closed.some((record) => record.date === date));
  log.info(`Montando o relatório da semana ${weekStart}: ${closed.length} dia(s) entram.`, {
    entram: closed.map((record) => `${record.date}:${record.status}`).join(' '),
    ...(ignored.length ? { ficamDeFora: ignored.map((date) => `${date}:${byDate.get(date)?.status ?? 'sem registro'}`).join(' ') } : {}),
  });

  const days = await mapLimited(closed, NARRATIVE_CONCURRENCY, (record) => buildDay(child, record));
  const first = closed[0]?.date ?? dates[0];
  const last = closed.at(-1)?.date ?? dates.at(-1);

  return {
    header: {
      patient: child.fullName || child.name,
      period: `${formatDayMonth(first)} a ${formatDayMonth(last)}`,
      school: child.schoolName || env.REPORT_SCHOOL_NAME,
      applicator: user.fullName,
      monitor: child.monitorName || env.REPORT_MONITOR_NAME,
      supervisor: child.supervisorName || env.REPORT_SUPERVISOR_NAME,
    },
    days,
  };
}
