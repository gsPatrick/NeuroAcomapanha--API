import { DataTypes } from 'sequelize';

// Troca de senha no primeiro acesso e Face ID / biometria (passkeys WebAuthn).
export async function up({ context: queryInterface }) {
  await queryInterface.addColumn('users', 'must_change_password', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

  await queryInterface.createTable('passkeys', {
    id: { type: DataTypes.UUID, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    credential_id: { type: DataTypes.STRING(512), allowNull: false, unique: true },
    public_key: { type: DataTypes.TEXT, allowNull: false },
    counter: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    transports: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    device_name: { type: DataTypes.STRING(120) },
    last_used_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('passkeys', ['user_id']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('passkeys');
  await queryInterface.removeColumn('users', 'must_change_password');
}
