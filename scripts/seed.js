// Dados iniciais: cria a conta da Amanda e a criança dela. Pode rodar quantas vezes quiser (idempotente):
// conta que já existe NÃO é alterada (nem a senha) e só ganha a criança se ainda não tiver nenhuma.
//
// A conta nasce com SENHA PROVISÓRIA: no primeiro acesso o app pede que a Amanda defina a dela.
// Defina a provisória em SEED_TEMP_PASSWORD (mín. 8 caracteres); sem ela, uma é sorteada e mostrada UMA vez aqui.
// Uso: npm run seed
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Child, sequelize, User } from '../src/models/index.js';
import { amanda, amandaChildren } from '../seeds/amanda.js';
import { todayKey } from '../src/utils/dates.js';

const randomPassword = () => crypto.randomBytes(9).toString('base64url'); // 12 caracteres

try {
  let user = await User.findOne({ where: { email: amanda.email } });

  if (user) {
    console.log(`Conta já existe (${amanda.email}): senha mantida.`);
  } else {
    const provided = process.env.SEED_TEMP_PASSWORD;
    if (provided && provided.length < 8) throw new Error('SEED_TEMP_PASSWORD precisa ter ao menos 8 caracteres.');
    const temporary = provided || randomPassword();
    user = await User.create({ ...amanda, passwordHash: await bcrypt.hash(temporary, 10), mustChangePassword: true });
    console.log(`Conta criada: ${amanda.email}`);
    console.log(provided ? 'Senha provisória: a que está em SEED_TEMP_PASSWORD.' : `Senha provisória (aparece só agora): ${temporary}`);
    console.log('No primeiro acesso, a Amanda define a própria senha.');
  }

  if ((await Child.count({ where: { userId: user.id } })) === 0) {
    for (const [position, child] of amandaChildren.entries()) {
      await Child.create({ ...child, position, userId: user.id, startedAt: todayKey() });
    }
    console.log(`Alunos criados: ${amandaChildren.map((child) => child.name).join(', ')}`);
  }
} finally {
  await sequelize.close();
}
