// Teste de ponta a ponta: banco real + OpenAI FALSA (servidor local que imita a Responses API).
// Uso: npm run smoke:test   (SMOKE_OUT=/pasta copia o PDF/DOCX gerados para essa pasta)
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

// 1) OpenAI falsa: devolve, para cada momento recebido, um texto fixo no formato esperado.
let aiCalls = 0;
const fakeOpenAI = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    aiCalls += 1;
    const request = JSON.parse(body);
    const userText = request.input.find((item) => item.role === 'user').content;
    const blocks = [...userText.matchAll(/"blockId": "([^"]+)"[\s\S]*?"title": "([^"]+)"/g)].map(([, blockId, title]) => ({
      blockId,
      observed: `Texto redigido pela IA para ${title}.`,
      goals: [`Objetivo de ${title}.`],
    }));
    const output = [{ type: 'message', id: 'msg_1', status: 'completed', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify({ blocks }), annotations: [] }] }];
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ id: 'resp_1', object: 'response', created_at: 0, status: 'completed', model: 'fake-model', output, parallel_tool_calls: false, tool_choice: 'auto', tools: [] }));
  });
});
await new Promise((resolve) => fakeOpenAI.listen(0, '127.0.0.1', resolve));

const storage = await fs.mkdtemp(path.join(os.tmpdir(), 'mysessions-smoke-'));
Object.assign(process.env, {
  OPENAI_API_KEY: 'sk-fake', OPENAI_BASE_URL: `http://127.0.0.1:${fakeOpenAI.address().port}/v1`, OPENAI_MAX_RETRIES: '0',
  REPORTS_STORAGE_DIR: storage, AUTO_GENERATE_REPORT: 'true',
});

// 2) API real, em porta aleatória.
const { default: app } = await import('../app.js');
const { sequelize, User } = await import('../src/models/index.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;

let token;
const call = async (method, url, body, expected = 200) => {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const isFile = (response.headers.get('content-type') ?? '').match(/pdf|officedocument/);
  const payload = isFile ? Buffer.from(await response.arrayBuffer()) : response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${method} ${url} -> ${response.status} ${JSON.stringify(payload)}`);
  return isFile ? payload : payload?.data;
};

const email = `smoke-${Date.now()}@example.com`;
try {
  // Validação Zod e auth
  await call('POST', '/auth/register', { email: 'x', password: '1' }, 422);
  await call('GET', '/children', undefined, 401);

  const auth = await call('POST', '/auth/register', { fullName: 'Amanda Teste', email, password: 'senha-forte-123' }, 201);
  token = auth.token;
  await call('POST', '/auth/login', { email, password: 'errada-errada' }, 401);

  // Perfil da AT: nome curto, função padrão e desde quando está na plataforma; ela pode trocar função/ilustração.
  const profile = await call('GET', '/auth/me');
  assert.equal(profile.firstName, 'Amanda');
  assert.equal(profile.role, 'Acompanhante terapêutica (AT)');
  assert.match(profile.joinedAt, /^\d{4}-\d{2}-\d{2}$/);
  const edited = await call('PATCH', '/auth/me', { avatar: { hair: 'long', skin: 'tan' }, role: 'AT escolar' });
  assert.equal(edited.role, 'AT escolar');
  assert.equal(edited.avatar.hair, 'long');
  await call('PATCH', '/auth/me', {}, 422);

  const routine = Object.fromEntries([1, 2, 3, 4, 5].map((day) => [day, { attends: true, welcome: true, classes: ['Português'] }]));
  const child = await call('POST', '/children', { name: 'Maria Fernanda', fullName: 'Maria Fernanda Soares Silva', schoolName: 'Escola Teste', monitorName: 'Monitora Teste', supervisorName: 'Supervisora Teste', routine }, 201);
  assert.ok(child.startedAt, 'startedAt tem padrão (hoje)');

  // Cadastro completo de uma vez (onboarding): mantém o aluno existente, cria o novo, respeita a ordem e remove quem saiu.
  const photo = 'data:image/jpeg;base64,/9j/4AAQ';
  const synced = await call('PUT', '/children', {
    children: [
      { name: 'Theo Barreto', avatar: { hair: 'short', skin: 'medium' }, conditions: [{ id: 'tdah', levels: { tipo: 'combinada' } }], routine: { 1: { attends: true, welcome: false, classes: ['Artes'] } } },
      { id: child.id, name: 'Maria Fernanda', photo, avatar: { hair: 'ponytail' }, conditions: [{ id: 'tea', levels: { suporte: '2' } }], routine },
      { id: 'id-que-nao-existe', name: 'Aluno Removido Depois' },
    ],
  });
  assert.deepEqual(synced.map((item) => item.name), ['Theo Barreto', 'Maria Fernanda', 'Aluno Removido Depois']);
  assert.equal(synced[1].id, child.id, 'aluno conhecido é atualizado, não recriado');
  assert.equal(synced[1].photo, photo);
  assert.deepEqual(synced[1].conditions, [{ id: 'tea', levels: { suporte: '2' } }]);
  assert.equal(synced[0].avatar.hair, 'short');
  const afterSync = await call('PUT', '/children', { children: synced.slice(0, 2).map(({ id, name }) => ({ id, name })) });
  assert.equal(afterSync.length, 2, 'quem não está na lista é removido');
  assert.deepEqual((await call('GET', `/children/${child.id}`)).conditions, [{ id: 'tea', levels: { suporte: '2' } }], 'campos não enviados ficam como estavam');
  await call('PUT', '/children', { children: [{ id: child.id, name: 'Maria Fernanda', routine }] }); // só a Maria; sem foto no corpo = foto intacta
  const kept = await call('GET', `/children/${child.id}`);
  assert.equal(kept.photo, photo);
  assert.equal(kept.routine[1].classes[0], 'Português', 'rotina não enviada é preservada');
  assert.equal((await call('GET', '/children')).length, 1);

  const records = `/children/${child.id}/records`;
  const reports = `/children/${child.id}/reports`;

  const day = (n) => ({
    blocks: [
      { id: `a${n}`, kind: 'welcome', title: 'Acolhimento' },
      { id: `l${n}`, kind: 'snack', title: 'Lanche' },
      { id: `v${n}`, kind: 'class', title: 'Sem dados' }, // sem nada marcado: deve ser omitido
    ],
    events: [
      { id: `e1-${n}`, blockId: `a${n}`, key: 'note', at: Date.now(), text: 'Chegou e cumprimentou a AT.' },
      { id: `e2-${n}`, blockId: `l${n}`, key: 'snack', at: Date.now() },
      ...(n === 28 ? [{ id: 'e3', blockId: `a${n}`, key: 'crisis', at: Date.now(), antecedent: 'Mudança de rotina', consequence: 'Pausa' }] : []),
    ],
    answers: { [`a${n}`]: { enteredCalmly: { answer: 'yes', obs: '' } } },
  });

  const saved = await call('PUT', `${records}/2026-10-26`, { ...day(26), cursor: 'l26' });
  assert.equal(saved.cursor, 'l26', 'guarda o momento em que a AT parou');
  await call('PUT', `${records}/2026-10-30`, { ...day(30), blocks: [{ id: 'm', kind: 'other', title: 'Aula Livre', observed: 'Texto escrito pela AT.', goals: ['Meta da AT.'] }], events: [], answers: {} });
  const suspended = await call('POST', `${records}/2026-10-27/suspend`, {});
  assert.equal(suspended.weekReport, null, 'semana ainda incompleta: nada a gerar');
  await call('POST', `${records}/2026-10-26/finish`);
  await call('PUT', `${records}/2026-10-27`, day(27), 409); // dia suspenso não recebe registro até reabrir
  await call('PUT', `${records}/2026-10-28`, day(28));
  await call('POST', `${records}/2026-10-28/finish`);
  await call('PUT', `${records}/2026-10-29`, day(29));
  await call('POST', `${records}/2026-10-29/finish`);
  await call('POST', `${records}/2026-10-31/finish`, undefined, 400); // dia sem registro
  await assert.rejects(call('GET', `${reports}/2026-10-26`)); // ainda faltam dias: nada gerado
  const closing = await call('POST', `${records}/2026-10-30/finish`); // último dia: dispara o relatório sozinho
  assert.deepEqual(closing.weekReport, { weekStart: '2026-10-26', status: 'generating' }, 'o app é avisado de que o relatório começou');

  // Visão leve para calendário/agenda/números do mês
  const attendance = await call('GET', '/attendance?from=2026-10-01&to=2026-10-31');
  assert.deepEqual(attendance.map((item) => `${item.date}:${item.status}`), ['2026-10-26:finished', '2026-10-27:suspended', '2026-10-28:finished', '2026-10-29:finished', '2026-10-30:finished']);
  assert.ok(attendance.every((item) => item.childId === child.id && item.filled !== undefined));
  await call('GET', '/attendance?from=2026-10-31&to=2026-10-01', undefined, 422);

  let report;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    report = await call('GET', `${reports}/2026-10-28`); // qualquer dia da semana vale
    if (report.status !== 'generating') break;
  }
  assert.equal(report.status, 'ready', `status=${report.status} ${report.errorMessage ?? ''}`);
  assert.equal(report.content.header.period, '26/10 a 30/10');
  assert.equal(report.content.days.length, 5);
  assert.equal(report.content.days[1].note, 'atendimento suspenso pela família.');
  assert.equal(report.content.days[0].stages.length, 2, 'momento sem dados deve ser omitido');
  assert.equal(report.content.days[4].stages[0].observed, 'Texto escrito pela AT.', 'texto da AT não pode ser reescrito');
  assert.equal(report.content.behaviors.length, 1);
  assert.equal(aiCalls, 3, 'um pedido à IA por dia com atendimento (o dia 30 é todo manual e não chama)');

  const pdf = await call('GET', `${reports}/2026-10-26/download?format=pdf`);
  const docx = await call('GET', `${reports}/2026-10-26/download?format=docx`);
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.equal(docx.subarray(0, 2).toString(), 'PK');
  if (process.env.SMOKE_OUT) {
    await fs.mkdir(process.env.SMOKE_OUT, { recursive: true });
    await fs.writeFile(path.join(process.env.SMOKE_OUT, 'smoke.pdf'), pdf);
    await fs.writeFile(path.join(process.env.SMOKE_OUT, 'smoke.docx'), docx);
  }

  await call('POST', reports, { weekStart: '2026-10-29' }, 202); // geração manual de novo
  await call('POST', reports, { weekStart: '2026-10-29' }, 409); // já em andamento: não duplica
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if ((await call('GET', `${reports}/2026-10-29`)).status !== 'generating') break;
  }
  assert.equal((await call('GET', `${reports}/2026-10-29`)).status, 'ready');
  console.log('smoke:test OK — fluxo completo, PDF', pdf.length, 'bytes, chamadas à IA:', aiCalls);
} finally {
  await User.destroy({ where: { email } });
  server.close();
  fakeOpenAI.close();
  await sequelize.close();
  await fs.rm(storage, { recursive: true, force: true });
}
