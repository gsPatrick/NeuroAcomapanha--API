// Conta de TESTE ("Amanda Teste") com a semana atual preenchida: todos os dias de atendimento até HOJE ficam registrados e
// finalizados, para você abrir o app, ir em Crianças > Maria Fernanda > semana e tocar em "Gerar relatório".
// Pode rodar de novo: refaz o preenchimento (marcações e anotações) dos dias da semana. Não mexe na conta real da Amanda.
//
// Senha da conta de teste: SEED_TEST_PASSWORD (mín. 8) — sem ela, uma é sorteada e mostrada aqui (só na criação).
// Uso: npm run seed:teste            (dias da semana até hoje)
//      npm run seed:semana           (a semana TODA, segunda a sexta, inclusive dias que ainda não chegaram: relatório completo)
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Child, DailyRecord, sequelize, User } from '../src/models/index.js';
import { addDays, mondayOf, weekdayOf } from '../src/utils/dates.js';
import { NOTES, summaries, testChild, testUser } from '../seeds/amanda-teste.js';

// "Hoje" no Brasil (o servidor pode estar em UTC e já estar no dia seguinte).
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

// --semana-toda: preenche também os dias depois de hoje (só para ver um relatório completo; são dados de teste).
const wholeWeek = process.argv.includes('--semana-toda');

const pick = (list, index) => list[index % list.length];

function buildDay(date, routineDay, dayIndex) {
  const blocks = [];
  const add = (kind, title) => blocks.push({ id: `${date}-${blocks.length}`, kind, title });
  if (routineDay.welcome) add('welcome', 'Acolhimento');
  routineDay.classes.forEach((name) => add('class', name));
  add('snack', 'Lanche');
  add('play', 'Brincadeiras');

  const start = Date.parse(`${date}T11:00:00Z`); // 08:00 em Brasília
  const events = [];
  const answers = {};
  blocks.forEach((block, index) => {
    const pool = NOTES[block.title] ?? NOTES[block.kind];
    if (!pool) return;
    const content = pick(pool, dayIndex);
    const base = start + index * 50 * 60000;
    events.push({ id: `${block.id}-n`, blockId: block.id, key: 'note', at: base + 30 * 60000, text: content.note });
    content.marks.forEach((key, markIndex) => events.push({ id: `${block.id}-m${markIndex}`, blockId: block.id, key, at: base + (5 + markIndex * 7) * 60000 }));
    if (content.occurrence) {
      const { key, antecedent, consequence } = content.occurrence;
      const found = events.find((event) => event.blockId === block.id && event.key === key);
      if (found) Object.assign(found, { antecedent, consequence });
    }
    answers[block.id] = Object.fromEntries(
      Object.entries(content.answers).map(([question, value]) => [question, typeof value === 'string' ? { answer: value, obs: '' } : { answer: null, obs: value.obs }]),
    );
  });
  return { blocks, events, answers, summary: pick(summaries, dayIndex) };
}

try {
  let user = await User.findOne({ where: { email: testUser.email } });
  if (!user) {
    const provided = process.env.SEED_TEST_PASSWORD;
    if (provided && provided.length < 8) throw new Error('SEED_TEST_PASSWORD precisa ter ao menos 8 caracteres.');
    const password = provided || crypto.randomBytes(9).toString('base64url');
    user = await User.create({ ...testUser, passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false });
    console.log(`Conta de teste criada: ${testUser.email}`);
    console.log(provided ? 'Senha: a de SEED_TEST_PASSWORD.' : `Senha (aparece só agora): ${password}`);
  } else {
    console.log(`Conta de teste já existe: ${testUser.email} (senha mantida).`);
  }

  let child = await Child.findOne({ where: { userId: user.id } });
  if (!child) child = await Child.create({ ...testChild, userId: user.id, startedAt: addDays(mondayOf(today), -7) });

  // Todos os dias de atendimento da semana de hoje (até hoje, ou a semana toda com --semana-toda).
  const monday = mondayOf(today);
  let filled = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(monday, offset);
    const routineDay = child.routine[weekdayOf(date)];
    if ((!wholeWeek && date > today) || !routineDay?.attends) continue;

    const day = buildDay(date, routineDay, filled);
    const values = { ...day, status: 'finished', finishedAt: new Date(), suspensionNote: null, cursor: null };
    const existing = await DailyRecord.findOne({ where: { childId: child.id, date } });
    if (existing) await existing.update(values);
    else await DailyRecord.create({ ...values, childId: child.id, date });
    filled += 1;
    console.log(`  ${date}: ${day.blocks.length} momentos preenchidos e finalizados`);
  }

  console.log(`Pronto: ${filled} dia(s) da semana de ${monday}. No app: Crianças > ${testChild.name.split(' ')[0]} > semana > Gerar relatório.`);
  if (wholeWeek) console.log('Semana completa: o relatório também sai sozinho se você finalizar o último dia pelo app.');
} finally {
  await sequelize.close();
}
