import { Child, sequelize } from '../../models/index.js';
import { AppError } from '../../utils/app-error.js';
import { todayKey } from '../../utils/dates.js';

// Também usado por records e reports: toda rota por aluno passa por aqui, e cada AT só enxerga os seus alunos.
export async function getOwnedChild(userId, childId) {
  const child = await Child.findOne({ where: { id: childId, userId } });
  if (!child) throw AppError.notFound('Aluno não encontrado.', 'CHILD_NOT_FOUND');
  return child;
}

export const listChildren = (userId) => Child.findAll({ where: { userId }, order: [['position', 'ASC'], ['createdAt', 'ASC']] });

// `startedAt` = quando a AT passou a acompanhar: o histórico do perfil começa nessa data (padrão: hoje).
export const createChild = (userId, data) => Child.create({ startedAt: todayKey(), ...data, userId });

export async function updateChild(userId, childId, data) {
  const child = await getOwnedChild(userId, childId);
  return child.update(data);
}

export async function deleteChild(userId, childId) {
  const child = await getOwnedChild(userId, childId);
  await child.destroy();
}

// Substitui o cadastro inteiro numa transação só (o onboarding do app sempre envia o conjunto completo).
export async function syncChildren(userId, items) {
  await sequelize.transaction(async (transaction) => {
    const existing = await Child.findAll({ where: { userId }, transaction });
    const byId = new Map(existing.map((child) => [child.id, child]));
    const keptIds = new Set();

    for (const [position, { id, ...data }] of items.entries()) {
      const current = byId.get(id);
      if (current) {
        await current.update({ ...data, position }, { transaction });
        keptIds.add(current.id);
      } else {
        const created = await Child.create({ startedAt: todayKey(), ...data, position, userId }, { transaction });
        keptIds.add(created.id);
      }
    }

    await Child.destroy({ where: { userId, id: existing.filter((child) => !keptIds.has(child.id)).map((child) => child.id) }, transaction });
  });
  return listChildren(userId);
}
