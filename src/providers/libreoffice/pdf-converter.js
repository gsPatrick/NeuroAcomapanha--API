import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const run = promisify(execFile);

// Converte DOCX em PDF com o LibreOffice (headless). Cada conversão usa uma pasta de perfil própria,
// para duas conversões ao mesmo tempo não brigarem pelo mesmo perfil.
export async function convertDocxToPdf(docxBuffer) {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'mysessions-pdf-'));
  try {
    const input = path.join(work, 'relatorio.docx');
    await fs.writeFile(input, docxBuffer);
    await run(
      env.SOFFICE_BIN,
      [`-env:UserInstallation=file://${path.join(work, 'profile')}`, '--headless', '--convert-to', 'pdf', '--outdir', work, input],
      { timeout: env.SOFFICE_TIMEOUT_MS },
    );
    return await fs.readFile(path.join(work, 'relatorio.pdf'));
  } catch (error) {
    console.error('[libreoffice]', error.message);
    throw new AppError(500, 'PDF_CONVERSION_FAILED', 'Não foi possível converter o relatório para PDF.');
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}
