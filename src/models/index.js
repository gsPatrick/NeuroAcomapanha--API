import { sequelize } from '../config/database.js';
import { Child } from './Child.js';
import { DailyRecord } from './DailyRecord.js';
import { User } from './User.js';
import { WeeklyReport } from './WeeklyReport.js';

User.hasMany(Child, { foreignKey: 'userId', as: 'children' });
Child.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Child.hasMany(DailyRecord, { foreignKey: 'childId', as: 'records', onDelete: 'CASCADE' });
DailyRecord.belongsTo(Child, { foreignKey: 'childId', as: 'child' });

Child.hasMany(WeeklyReport, { foreignKey: 'childId', as: 'reports', onDelete: 'CASCADE' });
WeeklyReport.belongsTo(Child, { foreignKey: 'childId', as: 'child' });

export { sequelize, User, Child, DailyRecord, WeeklyReport };
