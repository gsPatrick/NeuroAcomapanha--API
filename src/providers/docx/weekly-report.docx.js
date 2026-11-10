import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, SectionType, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType,
} from 'docx';
import { env } from '../../config/env.js';

// Monta o DOCX do "Registro Semanal de Evolução" a partir do conteúdo já redigido (ver reports/report-content.service).
// Só desenha: não decide nada de negócio.
const FONT = 'Arial';
const SIZE = 24; // 12 pt
const PAGE_WIDTH = 11906; // A4
const MARGIN = { top: 700, bottom: 900, left: 1100, right: 700 };
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right;
const DEFAULT_LOGO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/logo-navarro.png');

const run = (text, options = {}) => new TextRun({ text, font: FONT, size: SIZE, ...options });
const line = (runs, spacing = {}) => new Paragraph({ children: runs, spacing: { line: 276, ...spacing } });

const label = (title, text, spacing) => line([run(`${title}: `, { bold: true }), run(text)], spacing);

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const THIN = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

async function loadLogo() {
  try {
    return await fs.readFile(env.REPORT_LOGO_PATH || DEFAULT_LOGO);
  } catch {
    return null; // sem logo, o relatório sai igual, só sem a imagem
  }
}

function titleBlock(logo) {
  const logoParagraph = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: logo ? [new ImageRun({ type: 'png', data: logo, transformation: { width: 150, height: 64 } })] : [],
  });
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [6200, CONTENT_WIDTH - 6200],
    borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: NO_BORDERS, width: { size: 6200, type: WidthType.DXA }, children: [line([run('REGISTRO SEMANAL DE EVOLUÇÃO', { bold: true })]), line([run('Intervenção Escolar', { bold: true })])] }),
          new TableCell({ borders: NO_BORDERS, width: { size: CONTENT_WIDTH - 6200, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, children: [logoParagraph] }),
        ],
      }),
    ],
  });
}

function headerLines(header) {
  const rows = [
    ['PACIENTE', header.patient], ['PERÍODO', header.period], ['NOME DA ESCOLA', header.school],
    ['APLICADORA', header.applicator], ['MONITORA', header.monitor], ['SUPERVISORA', header.supervisor],
  ].filter(([, value]) => value);
  return rows.map(([title, value], index) =>
    new Paragraph({ indent: { left: 200 }, spacing: { line: 276, before: index === 0 ? 360 : 60 }, children: [run(`${title}: ${value}`)] }),
  );
}

function dayBand(heading) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({ children: [new TableCell({ borders: BORDERS, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, children: [line([run(`DATA ${heading}`, { bold: true })], { before: 40, after: 40 })] })] })],
  });
}

function stageBlocks(stage) {
  return [
    new Paragraph({ keepNext: true, spacing: { line: 276, before: 360 }, children: [run('ATIVIDADE ou ETAPA DA ROTINA ESCOLAR: ', { bold: true }), run(stage.title)] }),
    new Paragraph({ keepNext: true, spacing: { line: 276, before: 240 }, children: [run('Comportamentos observados:', { bold: true })] }),
    new Paragraph({ spacing: { line: 276 }, children: [run(stage.observed)] }),
    new Paragraph({ keepNext: true, spacing: { line: 276, before: 240 }, children: [run('Objetivos trabalhados:', { bold: true })] }),
    ...stage.goals.map((goal, index) => new Paragraph({ keepNext: index < stage.goals.length - 1, spacing: { line: 276 }, children: [run(goal)] })),
  ];
}

function dayBlocks(day) {
  const blocks = [new Paragraph({ spacing: { before: 360 }, keepNext: true, children: [] }), dayBand(day.heading)];
  if (day.note) blocks.push(new Paragraph({ spacing: { line: 276, before: 240 }, children: [run(day.note)] }));
  day.stages.forEach((stage) => blocks.push(...stageBlocks(stage)));
  return blocks;
}

const BLANK_ROWS = 8;

// Tabela em branco: a AT preenche à mão (o sistema não preenche). Linhas altas para escrever.
function behaviorTable() {
  const widths = [1100, 1500, 2600, 2600, CONTENT_WIDTH - 7800];
  const cell = (text, index, fill) =>
    new TableCell({
      borders: BORDERS,
      width: { size: widths[index], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [run(text ?? '')] })],
    });
  const header = ['DATA', 'HORÁRIO', 'ANTECEDENTE', 'COMPORTAMENTO', 'CONSEQUÊNCIA'];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((text, index) => cell(text, index, 'A8D08D')) }),
      ...Array.from({ length: BLANK_ROWS }, () => new TableRow({ cantSplit: true, height: { value: 900, rule: 'atLeast' }, children: header.map((_, index) => cell('', index)) })),
    ],
  });
}

// Espaço acima do título para o bloco (título + tabela) ficar no MEIO da página. Calculado, e não pelo alinhamento vertical
// do Word, porque o LibreOffice (que gera o PDF) ignora esse alinhamento. Altura da página A4 menos margens, menos o bloco, dividido por dois.
const PAGE_HEIGHT = 16838;
const BLOCK_HEIGHT = 500 + 480 + 600 + BLANK_ROWS * 900; // título + espaço + linha do cabeçalho + linhas em branco (aprox., em twips)
const CENTERING_SPACE = Math.max(0, Math.round((PAGE_HEIGHT - MARGIN.top - MARGIN.bottom - BLOCK_HEIGHT) / 2));

// Título + tabela, sozinhos numa página só deles (seção nova), no meio da página.
function behaviorSection() {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: CENTERING_SPACE, after: 240 }, keepNext: true, children: [run('Registro de Comportamentos Inadequados:', { bold: true })] }),
    behaviorTable(),
  ];
}

export async function buildWeeklyReportDocx(content) {
  const logo = await loadLogo();
  const document = new Document({
    creator: 'MySessions',
    title: `Registro semanal de evolução — ${content.header.patient}`,
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [
      {
        properties: { page: { size: { width: PAGE_WIDTH, height: 16838 }, margin: MARGIN } },
        children: [
          titleBlock(logo),
          ...headerLines(content.header),
          ...content.days.flatMap(dayBlocks),
        ],
      },
      {
        // Seção própria: a tabela sempre começa numa página nova e fica sozinha, no meio da página.
        properties: { type: SectionType.NEXT_PAGE, page: { size: { width: PAGE_WIDTH, height: 16838 }, margin: MARGIN } },
        children: behaviorSection(),
      },
    ],
  });
  return Packer.toBuffer(document);
}
