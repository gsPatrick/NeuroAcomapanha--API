import OpenAI from 'openai';
import { AppError } from '../../utils/app-error.js';

// Traduz erros do SDK em AppError com `code` estável. Nunca repassa a mensagem original ao cliente
// (pode conter trechos do pedido, ou seja, dados da criança): ela só vai para o log do servidor.
export function mapOpenAIError(error) {
  if (error instanceof AppError) return error;

  console.error('[openai]', error?.status ?? '', error?.code ?? '', error?.message);

  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    return new AppError(502, 'OPENAI_AUTH', 'A OpenAI recusou a chave configurada no servidor.');
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AppError(503, 'OPENAI_RATE_LIMIT', 'Limite de uso da OpenAI atingido. Tente de novo em instantes.');
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AppError(504, 'OPENAI_TIMEOUT', 'A OpenAI demorou demais para responder.');
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new AppError(502, 'OPENAI_UNREACHABLE', 'Não foi possível falar com a OpenAI.');
  }
  if (error instanceof OpenAI.BadRequestError || error instanceof OpenAI.NotFoundError) {
    return new AppError(502, 'OPENAI_BAD_REQUEST', 'A OpenAI recusou o pedido (modelo ou formato inválido).');
  }
  return new AppError(502, 'OPENAI_FAILED', 'Falha ao gerar o texto com a OpenAI.');
}
