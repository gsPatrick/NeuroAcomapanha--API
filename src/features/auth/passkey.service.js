import jwt from 'jsonwebtoken';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { env } from '../../config/env.js';
import { Passkey, User } from '../../models/index.js';
import { AppError } from '../../utils/app-error.js';
import { signToken, toPublicUser } from './auth.service.js';

// Face ID / biometria do aparelho (WebAuthn). A chave privada nunca sai do aparelho; aqui só ficam a pública e um contador.
// O desafio de cada operação vai assinado num token curto (sem estado no servidor): o app o devolve junto com a resposta.
const CHALLENGE_TTL = '5m';
const origins = () => env.WEBAUTHN_ORIGIN.split(',').map((origin) => origin.trim());

const signChallenge = (challenge, purpose, userId) =>
  jwt.sign({ challenge, purpose }, env.JWT_SECRET, { expiresIn: CHALLENGE_TTL, ...(userId ? { subject: userId } : {}) });

function readChallenge(token, purpose, userId) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.purpose !== purpose || (userId && payload.sub !== userId)) throw new Error('desafio de outra operação');
    return payload.challenge;
  } catch {
    throw AppError.badRequest('O desafio expirou. Tente de novo.', 'PASSKEY_CHALLENGE_INVALID');
  }
}

const toBase64Url = (bytes) => Buffer.from(bytes).toString('base64url');
const fromBase64Url = (text) => new Uint8Array(Buffer.from(text, 'base64url'));

// 1) Opções para cadastrar o Face ID neste aparelho (a AT já está logada).
export async function startPasskeyRegistration(userId) {
  const user = await User.findByPk(userId, { include: [{ model: Passkey, as: 'passkeys' }] });
  const options = await generateRegistrationOptions({
    rpName: env.WEBAUTHN_RP_NAME,
    rpID: env.WEBAUTHN_RP_ID,
    userName: user.email,
    userDisplayName: user.fullName,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials: user.passkeys.map((passkey) => ({ id: passkey.credentialId, transports: passkey.transports })),
    // Só o biométrico/bloqueio do próprio aparelho (Face ID, Touch ID, Windows Hello), com verificação obrigatória.
    authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
  });
  return { options, challengeToken: signChallenge(options.challenge, 'passkey-register', userId) };
}

// 2) Confere a resposta do aparelho e guarda a chave pública.
export async function finishPasskeyRegistration(userId, { challengeToken, response, deviceName }) {
  const expectedChallenge = readChallenge(challengeToken, 'passkey-register', userId);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origins(),
      expectedRPID: env.WEBAUTHN_RP_ID,
      requireUserVerification: true,
    });
  } catch (error) {
    throw AppError.badRequest(`Não foi possível confirmar o Face ID: ${error.message}`, 'PASSKEY_REGISTRATION_FAILED');
  }
  if (!verification.verified) throw AppError.badRequest('Não foi possível confirmar o Face ID.', 'PASSKEY_REGISTRATION_FAILED');

  const { credential } = verification.registrationInfo;
  await Passkey.create({
    userId,
    credentialId: credential.id,
    publicKey: toBase64Url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
    deviceName: deviceName || null,
  });
  return { enabled: true };
}

// 3) Opções para entrar com o Face ID (sem e-mail e sem senha: o aparelho escolhe a credencial).
export async function startPasskeyLogin() {
  const options = await generateAuthenticationOptions({ rpID: env.WEBAUTHN_RP_ID, userVerification: 'required' });
  return { options, challengeToken: signChallenge(options.challenge, 'passkey-login') };
}

// 4) Confere a assinatura do aparelho e, se estiver certa, entrega o token (como o login por senha).
export async function finishPasskeyLogin({ challengeToken, response }) {
  const expectedChallenge = readChallenge(challengeToken, 'passkey-login');
  const passkey = await Passkey.findOne({ where: { credentialId: String(response.id ?? '') } });
  if (!passkey) throw AppError.unauthorized('Face ID não cadastrado neste aparelho.', 'PASSKEY_UNKNOWN');

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origins(),
      expectedRPID: env.WEBAUTHN_RP_ID,
      credential: { id: passkey.credentialId, publicKey: fromBase64Url(passkey.publicKey), counter: Number(passkey.counter), transports: passkey.transports },
      requireUserVerification: true,
    });
  } catch (error) {
    throw AppError.unauthorized(`Não foi possível confirmar o Face ID: ${error.message}`, 'PASSKEY_VERIFICATION_FAILED');
  }
  if (!verification.verified) throw AppError.unauthorized('Não foi possível confirmar o Face ID.', 'PASSKEY_VERIFICATION_FAILED');

  await passkey.update({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() });
  const user = await User.findByPk(passkey.userId);
  return { user: toPublicUser(user), token: signToken(user) };
}

// Desliga o Face ID de TODOS os aparelhos da AT (ela volta a entrar só com a senha).
export async function removePasskeys(userId) {
  await Passkey.destroy({ where: { userId } });
}
