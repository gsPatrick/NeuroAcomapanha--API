import { z } from 'zod';
import { generateStructured } from '../../providers/openai/index.js';
import { createLogger } from '../../utils/logger.js';
import { cleanText, firstName } from '../../utils/text.js';
import { MARK_LABELS, QUESTION_LABELS } from '../records/records.constants.js';
import { NARRATIVE_SYSTEM_PROMPT, buildDayPrompt } from './report-narrative.prompts.js';

const log = createLogger('redação');

const narrativeSchema = z.object({
  blocks: z.array(z.object({ blockId: z.string(), observed: z.string().min(1).max(1500), goals: z.array(z.string().min(1).max(300)).min(1).max(4) })),
});

function describeAnswer(question, item) {
  const meta = QUESTION_LABELS[question] ?? { label: question };
  const value = item.answer === 'yes' ? (meta.type === 'check' ? 'Marcado' : 'Sim') : item.answer === 'no' ? 'Não' : item.answer;
  const text = [value, item.obs].filter(Boolean).join(' — ');
  return text ? { question: meta.label, answer: text } : null;
}

// O que a IA recebe de um momento: só texto de fatos, sem horários e sem dados que identifiquem a criança.
function toPromptBlock(record, block) {
  const events = record.events.filter((event) => event.blockId === block.id).sort((a, b) => a.at - b.at);
  return {
    blockId: block.id,
    title: block.title,
    kind: block.kind,
    notes: events.filter((event) => event.key === 'note' && event.text).map((event) => event.text),
    marks: events.filter((event) => event.key !== 'note').map((event) => MARK_LABELS[event.key] ?? event.key),
    answers: Object.entries(record.answers?.[block.id] ?? {}).map(([key, item]) => describeAnswer(key, item)).filter(Boolean),
    ...(block.observed ? { observedByAT: block.observed } : {}),
    ...(block.goals?.length ? { goalsByAT: block.goals } : {}),
  };
}

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ');
const words = (text) => new Set(normalize(text).split(' ').filter((word) => word.length > 3));

// Confere a regra "não repetir objetivos" no dia inteiro: objetivos iguais ou quase iguais em momentos diferentes.
function findRepeatedGoals(stages) {
  const goals = stages.flatMap((stage) => stage.goals.map((goal) => ({ stage: stage.title, goal })));
  const repeated = [];
  for (let first = 0; first < goals.length; first += 1) {
    for (let second = first + 1; second < goals.length; second += 1) {
      if (goals[first].stage === goals[second].stage) continue;
      const a = words(goals[first].goal);
      const b = words(goals[second].goal);
      const shared = [...a].filter((word) => b.has(word)).length;
      const similarity = shared / Math.max(1, Math.min(a.size, b.size));
      if (similarity >= 0.8) repeated.push(`"${goals[first].goal}" (${goals[first].stage}) ≈ "${goals[second].goal}" (${goals[second].stage})`);
    }
  }
  return repeated;
}

const hasFacts = (item) => item.notes.length || item.marks.length || item.answers.length || item.observedByAT;
const isComplete = (item) => item.observedByAT && item.goalsByAT;

/**
 * Redige as etapas de UM dia. Retorna [{ title, observed, goals }] na ordem da rotina.
 * - momento sem nenhum dado é omitido (não dá para inventar);
 * - momento que a AT já escreveu por inteiro (texto + objetivos) não passa pela IA;
 * - texto escrito pela AT nunca é reescrito: a IA só completa o que falta.
 */
export async function writeDayStages(child, record, weekday) {
  const items = record.blocks.map((block) => toPromptBlock(record, block));
  const withFacts = items.filter(hasFacts);
  const needsAI = withFacts.filter((item) => !isComplete(item));
  const omitted = items.filter((item) => !hasFacts(item));

  log.info(`${weekday}: ${record.blocks.length} momento(s) no registro.`, {
    comDados: withFacts.map((item) => item.title).join(' | ') || 'nenhum',
    ...(omitted.length ? { omitidosPorFaltaDeDados: omitted.map((item) => item.title).join(' | ') } : {}),
    ...(withFacts.length - needsAI.length ? { escritosPelaAT_semIA: withFacts.filter(isComplete).map((item) => item.title).join(' | ') } : {}),
  });
  withFacts.forEach((item) =>
    log.debug(`Fatos do momento "${item.title}"`, { anotacoes: item.notes.length, marcacoes: item.marks.join(', ') || '-', respostas: item.answers.length }),
  );

  const written = new Map();
  if (needsAI.length) {
    const user = buildDayPrompt({ weekday, childName: firstName(child.name), blocks: needsAI });
    log.info(`Enviando ${needsAI.length} momento(s) à IA.`, { momentos: needsAI.map((item) => item.title).join(' | ') });
    log.block('Mensagem enviada à IA (o que ela recebe da AT)', user);

    const { data } = await generateStructured({ system: NARRATIVE_SYSTEM_PROMPT, user, schema: narrativeSchema, schemaName: 'relatorio_dia' });

    const requestedIds = new Set(needsAI.map((item) => item.blockId));
    data.blocks.forEach((block) => {
      if (!requestedIds.has(block.blockId)) log.warn('A IA devolveu um momento que não foi pedido: ignorado.', { blockId: block.blockId });
      else written.set(block.blockId, block);
    });
    needsAI.filter((item) => !written.has(item.blockId)).forEach((item) =>
      log.warn(`A IA NÃO devolveu o momento "${item.title}": ele ficará fora do relatório.`, { blockId: item.blockId }),
    );
    needsAI.filter((item) => written.has(item.blockId)).forEach((item) => {
      const block = written.get(item.blockId);
      log.info(`IA redigiu "${item.title}": ${block.observed.length} caracteres e ${block.goals.length} objetivo(s).`);
      log.block(`Texto da IA para "${item.title}"`, `Comportamentos observados:\n${block.observed}\nObjetivos trabalhados:\n${block.goals.map((goal) => `- ${goal}`).join('\n')}`);
    });
  } else {
    log.info('Nenhum momento precisa da IA neste dia.');
  }

  const stages = withFacts.map((item) => {
    const ai = written.get(item.blockId);
    const observed = cleanText(item.observedByAT) || cleanText(ai?.observed);
    const goals = item.goalsByAT ?? ai?.goals ?? [];
    return { title: item.title, observed, goals: goals.map(cleanText).filter(Boolean) };
  }).filter((stage) => stage.observed);

  const repeated = findRepeatedGoals(stages);
  if (repeated.length) log.warn(`Objetivos repetidos entre momentos (a regra pede objetivos distintos): ${repeated.length}.`, { pares: repeated.join(' ;; ') });
  else if (stages.length > 1) log.info('Conferência: nenhum objetivo repetido entre os momentos do dia.');

  return stages;
}
