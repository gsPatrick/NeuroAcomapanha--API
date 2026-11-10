import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class WeeklyReport extends Model {}

WeeklyReport.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    childId: { type: DataTypes.UUID, allowNull: false },
    // Segunda-feira da semana.
    weekStart: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('generating', 'ready', 'failed'), allowNull: false, defaultValue: 'generating' },
    // Texto final do relatório (já redigido). Reemitir o arquivo não chama a IA de novo.
    content: { type: DataTypes.JSONB },
    docxPath: { type: DataTypes.STRING(400) },
    pdfPath: { type: DataTypes.STRING(400) },
    model: { type: DataTypes.STRING(80) },
    errorMessage: { type: DataTypes.TEXT },
    generatedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: 'weekly_reports',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['child_id', 'week_start'] }],
  },
);
