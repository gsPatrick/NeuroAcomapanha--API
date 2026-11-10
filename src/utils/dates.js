// Datas do domínio são sempre strings 'AAAA-MM-DD' (dia civil, sem fuso). Os cálculos usam UTC ao meio-dia
// só para evitar que o fuso do servidor desloque o dia.
const DAY_MS = 86400000;
const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parse = (key) => new Date(`${key}T12:00:00Z`);
const format = (date) => date.toISOString().slice(0, 10);

export const isValidDateKey = (key) => DATE_KEY_REGEX.test(key) && format(parse(key)) === key;
export const addDays = (key, days) => format(new Date(parse(key).getTime() + days * DAY_MS));
export const weekdayOf = (key) => parse(key).getUTCDay(); // 0 = domingo ... 6 = sábado
export const weekdayName = (key) => WEEKDAYS[weekdayOf(key)];

// Segunda-feira da semana de `key`.
export const mondayOf = (key) => {
  const weekday = weekdayOf(key);
  return addDays(key, weekday === 0 ? -6 : 1 - weekday);
};

// Os 7 dias da semana (segunda a domingo) que começa em `weekStart`.
export const weekDates = (weekStart) => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

export const todayKey = () => format(new Date());

// '2026-10-26' -> '26/10'
export const formatDayMonth = (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
// '2026-10-26' -> '26 (Segunda-feira)'
export const formatDayHeading = (key) => `${Number(key.slice(8, 10))} (${weekdayName(key)})`;
