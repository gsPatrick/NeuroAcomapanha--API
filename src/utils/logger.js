import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from '../config/env.js';

// Log legível (um evento por linha) com um "contexto" que acompanha o trabalho assíncrono sozinho:
// quem abre `withLogContext({ rel: 'a1b2c3' }, ...)` vê esse código em TODAS as linhas de dentro, sem passar parâmetro.
// Linhas "debug" (texto que vai e volta da IA, notas da AT) só saem com REPORT_DEBUG=true: são dados sensíveis de uma criança.
const store = new AsyncLocalStorage();

export const withLogContext = (context, task) => store.run({ ...store.getStore(), ...context }, task);

const LEVEL_TAG = { debug: 'DEBUG', info: 'INFO ', warn: 'AVISO', error: 'ERRO ' };

const stamp = () => {
  const now = new Date();
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(now);
  return `${time}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

const format = (value) => (typeof value === 'string' ? value : JSON.stringify(value));

function emit(level, scope, message, data) {
  if (level === 'debug' && !env.REPORT_DEBUG) return;
  const context = Object.entries(store.getStore() ?? {}).map(([key, value]) => `[${key} ${value}]`).join(' ');
  const details = data && Object.keys(data).length ? ` ${Object.entries(data).map(([key, value]) => `${key}=${format(value)}`).join(' ')}` : '';
  const line = `${stamp()} ${LEVEL_TAG[level]} ${context ? `${context} ` : ''}[${scope}] ${message}${details}`;
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

export function createLogger(scope) {
  return {
    debug: (message, data) => emit('debug', scope, message, data),
    info: (message, data) => emit('info', scope, message, data),
    warn: (message, data) => emit('warn', scope, message, data),
    error: (message, data) => emit('error', scope, message, data),
    // Texto longo (prompt, resposta da IA): vira um bloco indentado, só no modo debug.
    block(title, text) {
      if (!env.REPORT_DEBUG) return;
      const body = String(text).split('\n').map((line) => `      │ ${line}`).join('\n');
      emit('debug', scope, `${title}\n${body}`);
    },
  };
}

// Cronômetro: `const done = startTimer(); ... done()` devolve "1.23s".
export function startTimer() {
  const startedAt = performance.now();
  return () => `${((performance.now() - startedAt) / 1000).toFixed(2)}s`;
}
