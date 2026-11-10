import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

// Credencial de Face ID / biometria (WebAuthn) de um aparelho da AT. Só a chave PÚBLICA fica aqui; a privada nunca sai do aparelho.
export class Passkey extends Model {}

Passkey.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    credentialId: { type: DataTypes.STRING(512), allowNull: false, unique: true },
    publicKey: { type: DataTypes.TEXT, allowNull: false }, // base64url
    counter: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    transports: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    deviceName: { type: DataTypes.STRING(120) },
    lastUsedAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'passkeys', underscored: true, timestamps: true },
);
