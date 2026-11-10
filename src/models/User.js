import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class User extends Model {}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fullName: { type: DataTypes.STRING(160), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    // Função exibida no perfil (ex.: "Acompanhante terapêutica (AT)"), foto (data URL) e ilustração { hair, skin, ... } do app.
    role: { type: DataTypes.STRING(120) },
    photo: { type: DataTypes.TEXT },
    avatar: { type: DataTypes.JSONB },
  },
  { sequelize, tableName: 'users', underscored: true, timestamps: true },
);
