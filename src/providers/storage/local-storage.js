import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('arquivos');

// Arquivos gerados (DOCX/PDF) em disco. No banco guardamos só o caminho RELATIVO a REPORTS_STORAGE_DIR.
// Para trocar por S3/GCS, basta reimplementar estas três funções.
const root = () => path.resolve(env.REPORTS_STORAGE_DIR);

export const absolutePath = (relativePath) => {
  const full = path.resolve(root(), relativePath);
  if (!full.startsWith(root() + path.sep)) throw new Error('Caminho fora da pasta de armazenamento.');
  return full;
};

export async function saveFile(relativePath, buffer) {
  const full = absolutePath(relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
  log.info(`Arquivo gravado: ${relativePath} (${(buffer.length / 1024).toFixed(1)} KB)`, { pasta: root() });
  return relativePath;
}

export const readFile = (relativePath) => fs.readFile(absolutePath(relativePath));

export async function fileExists(relativePath) {
  try {
    await fs.access(absolutePath(relativePath));
    return true;
  } catch {
    return false;
  }
}
