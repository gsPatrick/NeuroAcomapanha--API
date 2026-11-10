import { env } from '../../config/env.js';
import { mondayOf } from '../../utils/dates.js';
import { createLogger } from '../../utils/logger.js';
import { firstName } from '../../utils/text.js';
import { runReport, startReport } from './report-generate.service.js';
import { describeWeek, isWeekComplete, loadWeekRecords } from './report-week.service.js';

const log = createLogger('gatilho');

// Chamado quando um dia é fechado/suspenso. Se com isso a semana ficou completa, começa a gerar o relatório.
// Devolve { weekStart, status } quando a geração começou (para o app avisar a AT) e null quando não. Nunca lança:
// o fechamento do dia não pode falhar por causa do relatório. A redação em si roda em segundo plano.
export async function triggerReportIfWeekComplete(child, dateKey) {
  const weekStart = mondayOf(dateKey);
  const who = `${firstName(child.name)} (${child.id.slice(0, 8)})`;

  if (!env.AUTO_GENERATE_REPORT) {
    log.info('Geração automática desligada (AUTO_GENERATE_REPORT=false): nada a fazer.', { aluno: who });
    return null;
  }

  try {
    const records = await loadWeekRecords(child.id, weekStart);
    const week = describeWeek(child, weekStart, records);
    const summary = week.map((day) => `${day.date.slice(5)}:${day.status}`).join(' ');

    if (!isWeekComplete(child, weekStart, records)) {
      const pending = week.filter((day) => !['finished', 'suspended'].includes(day.status)).map((day) => `${day.date} (${day.status})`);
      log.info(`Dia ${dateKey} fechado, mas a semana de ${weekStart} ainda não está completa: relatório NÃO gerado.`, { aluno: who, semana: summary, faltam: pending.join(', ') || 'nenhum dia finalizado (só suspensos)' });
      return null;
    }

    log.info(`Dia ${dateKey} fechado e a semana de ${weekStart} está COMPLETA: iniciando o relatório.`, { aluno: who, semana: summary });
    const report = await startReport(child.id, weekStart);
    runReport(report.id); // segundo plano; runReport nunca lança
    return { weekStart, status: report.status };
  } catch (error) {
    // REPORT_IN_PROGRESS é esperado (dois cliques seguidos); qualquer outra falha só vai para o log.
    if (error.code === 'REPORT_IN_PROGRESS') {
      log.warn('Já existe uma geração em andamento para essa semana: não inicia outra.', { aluno: who, semana: weekStart });
      return { weekStart, status: 'generating' };
    }
    log.error('O gatilho automático falhou.', { aluno: who, erro: error.message });
    return null;
  }
}
