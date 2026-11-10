// Primeiro nome ("Maria Fernanda Soares" -> "Maria"). Usado para não enviar o nome completo a serviços externos.
export const firstName = (fullName = '') => fullName.trim().split(/\s+/)[0] ?? '';

export const cleanText = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');
