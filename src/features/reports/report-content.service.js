import { env } from '../../config/env.js';
import { formatDayHeading, formatDayMonth, weekdayName } from '../../utils/dates.js';
import { OCCURRENCE_MARKS, MARK_LABELS, DEFAULT_SUSPENSION_NOTE } from '../records/records.constants.js';
import { NARRATIVE_CONCURRENCY } from './reports.constants.js';
import { writeDayStages } from './report-narrative.service.js';
import { attendanceDates } from './report-week.service.js';

const timeOf = (epoch) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(epoch));

// Ocorrências (crise, fuga...) viram linhas da tabela "Registro de Comportamentos Inadequados".
function collectBehaviors(records) {
  return records
    .filter((record) => record.status === 'finished')
    .flatMap((record) =>
      record.events
        .filter((event) => OCCURRENCE_MARKS.includes(event.key))
        .sort((a, b) => a.at - b.at)
        .map((event) => ({ date: formatDayMonth(record.date), time: timeOf(event.at), antecedent: event.antecedent ?? '', behavior: MARK_LABELS[event.key] ?? event.key, consequence: event.consequence ?? '' })),
    );
}

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

async function buildDay(child, record) {
  const heading = formatDayHeading(record.date);
  if (record.status === 'suspended') return { heading, note: record.suspensionNote ?? DEFAULT_SUSPENSION_NOTE, stages: [] };
  return { heading, stages: await writeDayStages(child, record, weekdayName(record.date)) };
}

// Conteúdo final do relatório (texto já redigido). É isto que fica salvo e vira DOCX/PDF.
export async function buildReportContent({ child, user, weekStart, records }) {
  const dates = attendanceDates(child, weekStart);
  const byDate = new Map(records.map((record) => [record.date, record]));
  // Dias sem registro ou ainda abertos ficam de fora; só entram dias fechados ou suspensos.
  const closed = dates.map((date) => byDate.get(date)).filter((record) => record && ['finished', 'suspended'].includes(record.status));

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
    behaviors: collectBehaviors(closed),
  };
}
