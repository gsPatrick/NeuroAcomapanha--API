import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../src/config/database.js';

// Uso: node scripts/migrate.js up | down | status
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js',
    resolve: ({ name, path: filePath, context }) => ({
      name,
      up: async () => (await import(pathToFileURL(path.resolve(filePath)).href)).up({ context }),
      down: async () => (await import(pathToFileURL(path.resolve(filePath)).href)).down({ context }),
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
  logger: console,
});

const command = process.argv[2] ?? 'up';
try {
  if (command === 'up') await umzug.up();
  else if (command === 'down') await umzug.down();
  else if (command === 'status') console.log(await umzug.executed(), await umzug.pending());
  else throw new Error(`Comando desconhecido: ${command}`);
} finally {
  await sequelize.close();
}
