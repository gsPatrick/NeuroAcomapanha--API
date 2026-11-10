// Quantos dias da semana são redigidos pela IA ao mesmo tempo.
export const NARRATIVE_CONCURRENCY = 3;
// Um relatório "gerando" há mais que isso é considerado travado (ex.: servidor reiniciou) e pode ser gerado de novo.
export const STALE_GENERATING_MS = 10 * 60 * 1000;
// Dias de atendimento assumidos quando o aluno não tem rotina cadastrada: segunda a sexta.
export const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
export const REPORT_FORMATS = ['pdf', 'docx'];
