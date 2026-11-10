import { DataTypes } from 'sequelize';

// Campos que o app já usa e a API ainda não guardava: perfil da AT, foto/ilustração/diagnósticos do aluno,
// ordem dos alunos e o momento em que a AT parou no registro do dia.
export async function up({ context: queryInterface }) {
  await queryInterface.addColumn('users', 'role', { type: DataTypes.STRING(120) });
  await queryInterface.addColumn('users', 'photo', { type: DataTypes.TEXT });
  await queryInterface.addColumn('users', 'avatar', { type: DataTypes.JSONB });

  await queryInterface.addColumn('children', 'photo', { type: DataTypes.TEXT });
  await queryInterface.addColumn('children', 'avatar', { type: DataTypes.JSONB });
  await queryInterface.addColumn('children', 'conditions', { type: DataTypes.JSONB, allowNull: false, defaultValue: [] });
  await queryInterface.addColumn('children', 'position', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });

  await queryInterface.addColumn('daily_records', 'cursor', { type: DataTypes.STRING(60) });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('daily_records', 'cursor');
  for (const column of ['position', 'conditions', 'avatar', 'photo']) await queryInterface.removeColumn('children', column);
  for (const column of ['avatar', 'photo', 'role']) await queryInterface.removeColumn('users', column);
}
