// Cria (ou redefine a senha de) uma conta de AT direto no banco. Não existe tela de cadastro no app:
// é assim que a conta da AT nasce. Uso: npm run user:create -- "Nome Completo" email@exemplo.com senha-com-8-ou-mais
import bcrypt from 'bcryptjs';
import { sequelize, User } from '../src/models/index.js';

const [fullName, rawEmail, password] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (!fullName || !email || !password || password.length < 8) {
  console.error('Uso: npm run user:create -- "Nome Completo" email@exemplo.com senha (mínimo 8 caracteres)');
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    await existing.update({ fullName, passwordHash });
    console.log(`Conta atualizada: ${email}`);
  } else {
    await User.create({ fullName, email, passwordHash });
    console.log(`Conta criada: ${email}`);
  }
} finally {
  await sequelize.close();
}
