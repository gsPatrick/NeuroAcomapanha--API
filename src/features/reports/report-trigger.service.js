import { env } from '../../config/env.js';
import { mondayOf } from '../../utils/dates.js';
import { runReport, startReport } from './report-generate.service.js';
import { isWeekComplete, loadWeekRecords } from './report-week.service.js';

// Chamado quando um dia é fechado/suspenso. Se com isso a semana ficou completa, começa a gerar o relatório.
// Devolve { weekStart, status } quando a geração começou (para o app avisar a AT) e null quando não. Nunca lança:
// o fechamento do dia não pode falhar por causa do relatório. A redação em si roda em segundo plano.
export async function triggerReportIfWeekComplete(child, dateKey) {
  if (!env.AUTO_GENERATE_REPORT) return null;
  const weekStart = mondayOf(dateKey);

  try {
    const records = await loadWeekRecords(child.id, weekStart);
    if (!isWeekComplete(child, weekStart, records)) return null;
    const report = await startReport(child.id, weekStart);
    runReport(report.id); // segundo plano; runReport nunca lança
    return { weekStart, status: report.status };
  } catch (error) {
    // REPORT_IN_PROGRESS é esperado (dois cliques seguidos); qualquer outra falha só vai para o log.
    if (error.code === 'REPORT_IN_PROGRESS') return { weekStart, status: 'generating' };
    console.error('[report] gatilho automático falhou:', error.message);
    return null;
  }
}
