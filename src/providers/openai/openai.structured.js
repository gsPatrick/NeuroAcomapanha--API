import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { createLogger, startTimer } from '../../utils/logger.js';
import { getOpenAIClient } from './openai.client.js';
import { mapOpenAIError } from './openai.errors.js';

const log = createLogger('openai');

// O modo `strict` da OpenAI aceita só um subconjunto de JSON Schema: tiramos limites de tamanho/valor
// (continuam valendo na validação Zod da resposta, abaixo) e o `$schema`.
const UNSUPPORTED = new Set(['$schema', 'minItems', 'maxItems', 'minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'format']);
function toStrictJsonSchema(node) {
  if (Array.isArray(node)) return node.map(toStrictJsonSchema);
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).filter(([key]) => !UNSUPPORTED.has(key)).map(([key, value]) => [key, toStrictJsonSchema(value)]));
  }
  return node;
}

/**
 * Pede à OpenAI uma resposta em JSON que obedece a `schema` (Zod) e devolve o objeto já validado.
 *
 * @param {object} options
 * @param {string} options.system     instruções fixas (papel, tom, regras)
 * @param {string} options.user       os dados do pedido
 * @param {import('zod').ZodType} options.schema  formato esperado da resposta
 * @param {string} options.schemaName nome do formato (a-z, 0-9, _ e -)
 * @param {string} [options.model]    padrão: OPENAI_MODEL
 */
export async function generateStructured({ system, user, schema, schemaName, model = env.OPENAI_MODEL }) {
  const client = getOpenAIClient();

  log.info(`Chamando a OpenAI (${model}, formato "${schemaName}").`, { instrucoes_chars: system.length, dados_chars: user.length });
  const elapsed = startTimer();
  let response;
  try {
    response = await client.responses.create({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      // Não guardar o conteúdo no lado da OpenAI: são dados sensíveis de uma criança.
      store: false,
      text: { format: { type: 'json_schema', name: schemaName, strict: true, schema: toStrictJsonSchema(z.toJSONSchema(schema)) } },
    });
  } catch (error) {
    const mapped = mapOpenAIError(error);
    log.error(`A OpenAI falhou depois de ${elapsed()}: ${mapped.code}.`, { http: error?.status ?? '-', motivo: mapped.message, original: String(error?.message ?? error).slice(0, 300) });
    throw mapped;
  }

  const usage = response.usage ?? {};
  log.info(`Resposta da OpenAI em ${elapsed()}.`, {
    status: response.status,
    modelo: response.model,
    id: response.id,
    tokens_entrada: usage.input_tokens ?? '-',
    tokens_saida: usage.output_tokens ?? '-',
  });

  if (response.status === 'incomplete') {
    log.error('A resposta veio incompleta.', { motivo: response.incomplete_details?.reason ?? '-' });
    throw new AppError(502, 'OPENAI_INCOMPLETE', 'A resposta da OpenAI veio incompleta.');
  }
  const refused = response.output?.flatMap((item) => item.content ?? []).some((part) => part.type === 'refusal');
  if (refused || !response.output_text) {
    log.error('A OpenAI recusou ou não devolveu texto.', { recusou: Boolean(refused) });
    throw new AppError(502, 'OPENAI_REFUSED', 'A OpenAI não gerou o texto solicitado.');
  }

  log.block('Resposta bruta da OpenAI (JSON)', response.output_text);

  let json;
  try {
    json = JSON.parse(response.output_text);
  } catch {
    log.error('A resposta não é um JSON válido.', { inicio: response.output_text.slice(0, 120) });
    throw new AppError(502, 'OPENAI_INVALID_JSON', 'A OpenAI devolveu um texto que não é JSON.');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    log.error('A resposta está fora do formato esperado.', { problemas: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).slice(0, 5).join(' ;; ') });
    throw new AppError(502, 'OPENAI_INVALID_SHAPE', 'A resposta da OpenAI veio fora do formato esperado.');
  }
  return { data: parsed.data, model: response.model ?? model };
}
