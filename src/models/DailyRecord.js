import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class DailyRecord extends Model {}

DailyRecord.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    childId: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    // open = em andamento · finished = dia fechado · suspended = atendimento suspenso
    status: { type: DataTypes.ENUM('open', 'finished', 'suspended'), allowNull: false, defaultValue: 'open' },
    suspensionNote: { type: DataTypes.STRING(300) },
    // Mesmo formato do registro do app: momentos, marcações rápidas, respostas da prancheta e resumo do dia.
    blocks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    events: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    answers: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    summary: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    // Id do momento em que a AT parou: o registro reabre ali.
    cursor: { type: DataTypes.STRING(60) },
    finishedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: 'daily_records',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['child_id', 'date'] }],
  },
);
