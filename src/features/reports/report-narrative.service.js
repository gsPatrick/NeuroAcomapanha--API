import { z } from 'zod';
import { generateStructured } from '../../providers/openai/index.js';
import { cleanText, firstName } from '../../utils/text.js';
import { MARK_LABELS, QUESTION_LABELS } from '../records/records.constants.js';
import { NARRATIVE_SYSTEM_PROMPT, buildDayPrompt } from './report-narrative.prompts.js';

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

const hasFacts = (item) => item.notes.length || item.marks.length || item.answers.length || item.observedByAT;
const isComplete = (item) => item.observedByAT && item.goalsByAT;

/**
 * Redige as etapas de UM dia. Retorna [{ title, observed, goals }] na ordem da rotina.
 * - momento sem nenhum dado é omitido (não dá para inventar);
 * - momento que a AT já escreveu por inteiro (texto + objetivos) não passa pela IA;
 * - texto escrito pela AT nunca é reescrito: a IA só completa o que falta.
 */
export async function writeDayStages(child, record, weekday) {
  const items = record.blocks.map((block) => toPromptBlock(record, block)).filter(hasFacts);
  const needsAI = items.filter((item) => !isComplete(item));

  const written = new Map();
  if (needsAI.length) {
    const { data } = await generateStructured({
      system: NARRATIVE_SYSTEM_PROMPT,
      user: buildDayPrompt({ weekday, childName: firstName(child.name), blocks: needsAI }),
      schema: narrativeSchema,
      schemaName: 'relatorio_dia',
    });
    data.blocks.forEach((block) => written.set(block.blockId, block));
  }

  return items.map((item) => {
    const ai = written.get(item.blockId);
    const observed = cleanText(item.observedByAT) || cleanText(ai?.observed);
    const goals = item.goalsByAT ?? ai?.goals ?? [];
    return { title: item.title, observed, goals: goals.map(cleanText).filter(Boolean) };
  }).filter((stage) => stage.observed);
}
