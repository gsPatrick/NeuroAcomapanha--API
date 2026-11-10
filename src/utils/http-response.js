// Formato padrão de resposta: { data } em sucesso, { error } em falha.
export const sendData = (res, data, status = 200) => res.status(status).json({ data });
