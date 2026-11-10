import { DataTypes } from 'sequelize';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true },
    full_name: { type: DataTypes.STRING(160), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(100), allowNull: false },
    ...timestamps,
  });

  await queryInterface.createTable('children', {
    id: { type: DataTypes.UUID, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    name: { type: DataTypes.STRING(120), allowNull: false },
    full_name: { type: DataTypes.STRING(160) },
    school_name: { type: DataTypes.STRING(160) },
    monitor_name: { type: DataTypes.STRING(160) },
    supervisor_name: { type: DataTypes.STRING(160) },
    routine: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    started_at: { type: DataTypes.DATEONLY },
    ...timestamps,
  });
  await queryInterface.addIndex('children', ['user_id']);

  await queryInterface.createTable('daily_records', {
    id: { type: DataTypes.UUID, primaryKey: true },
    child_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'children', key: 'id' }, onDelete: 'CASCADE' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('open', 'finished', 'suspended'), allowNull: false, defaultValue: 'open' },
    suspension_note: { type: DataTypes.STRING(300) },
    blocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    events: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    answers: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    summary: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    finished_at: { type: DataTypes.DATE },
    ...timestamps,
  });
  await queryInterface.addIndex('daily_records', ['child_id', 'date'], { unique: true });

  await queryInterface.createTable('weekly_reports', {
    id: { type: DataTypes.UUID, primaryKey: true },
    child_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'children', key: 'id' }, onDelete: 'CASCADE' },
    week_start: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('generating', 'ready', 'failed'), allowNull: false, defaultValue: 'generating' },
    content: { type: DataTypes.JSONB },
    docx_path: { type: DataTypes.STRING(400) },
    pdf_path: { type: DataTypes.STRING(400) },
    model: { type: DataTypes.STRING(80) },
    error_message: { type: DataTypes.TEXT },
    generated_at: { type: DataTypes.DATE },
    ...timestamps,
  });
  await queryInterface.addIndex('weekly_reports', ['child_id', 'week_start'], { unique: true });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('weekly_reports');
  await queryInterface.dropTable('daily_records');
  await queryInterface.dropTable('children');
  await queryInterface.dropTable('users');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_weekly_reports_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_daily_records_status"');
}
