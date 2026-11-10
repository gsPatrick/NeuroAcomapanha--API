import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Child extends Model {}

Child.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    // Nome curto, como aparece no app ("Maria Fernanda").
    name: { type: DataTypes.STRING(120), allowNull: false },
    // Nome completo, usado no cabeçalho do relatório.
    fullName: { type: DataTypes.STRING(160) },
    schoolName: { type: DataTypes.STRING(160) },
    monitorName: { type: DataTypes.STRING(160) },
    supervisorName: { type: DataTypes.STRING(160) },
    // { [diaDaSemana 0-6]: { attends, welcome, classes[] } } — mesmo formato do app.
    routine: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    startedAt: { type: DataTypes.DATEONLY },
    // Foto opcional (data URL já recortada pelo app) e ilustração usada quando não há foto.
    photo: { type: DataTypes.TEXT },
    avatar: { type: DataTypes.JSONB },
    // Neurodivergências informadas no cadastro: [{ id: 'tea', levels: { suporte: '2' } }]. Dado sensível de saúde.
    conditions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    // Ordem em que a AT cadastrou os alunos.
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'children', underscored: true, timestamps: true },
);
