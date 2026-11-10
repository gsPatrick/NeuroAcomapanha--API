import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User } from '../../models/index.js';
import { AppError } from '../../utils/app-error.js';
import { firstName } from '../../utils/text.js';

const DEFAULT_ROLE = 'Acompanhante terapêutica (AT)';

// Perfil como o app mostra: nome curto, função, foto/ilustração e desde quando está na plataforma (AAAA-MM-DD).
export const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  firstName: firstName(user.fullName),
  email: user.email,
  role: user.role ?? DEFAULT_ROLE,
  photo: user.photo ?? null,
  avatar: user.avatar ?? null,
  joinedAt: user.createdAt.toISOString().slice(0, 10),
  // true = conta com senha provisória: o app leva a AT a definir a própria senha antes de qualquer coisa.
  mustChangePassword: user.mustChangePassword,
});

export const signToken = (user) => jwt.sign({}, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN });

export async function registerUser({ fullName, email, password }) {
  if (await User.findOne({ where: { email } })) throw AppError.conflict('Já existe uma conta com esse e-mail.', 'EMAIL_IN_USE');
  const user = await User.create({ fullName, email, passwordHash: await bcrypt.hash(password, 10) });
  return { user: toPublicUser(user), token: signToken(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem).
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw AppError.unauthorized('E-mail ou senha incorretos.', 'INVALID_CREDENTIALS');
  }
  return { user: toPublicUser(user), token: signToken(user) };
}

export async function getCurrentUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.unauthorized('Conta não encontrada.', 'USER_NOT_FOUND');
  return toPublicUser(user);
}

export async function updateProfile(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.unauthorized('Conta não encontrada.', 'USER_NOT_FOUND');
  return toPublicUser(await user.update(data));
}

// Primeiro acesso: troca a senha provisória pela que a AT escolheu. Só vale enquanto a conta estiver marcada como provisória
// (quem chega aqui acabou de entrar com a senha provisória, então o token já prova que ela a conhece).
export async function setFirstPassword(userId, { newPassword }) {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.unauthorized('Conta não encontrada.', 'USER_NOT_FOUND');
  if (!user.mustChangePassword) throw AppError.conflict('A senha dessa conta já foi definida.', 'PASSWORD_ALREADY_SET');
  return toPublicUser(await user.update({ passwordHash: await bcrypt.hash(newPassword, 10), mustChangePassword: false }));
}
