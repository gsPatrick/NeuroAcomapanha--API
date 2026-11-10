import { catchAsync } from '../../utils/catch-async.js';
import { sendData } from '../../utils/http-response.js';
import { getCurrentUser, loginUser, registerUser, setFirstPassword, updateProfile } from './auth.service.js';
import { finishPasskeyLogin, finishPasskeyRegistration, removePasskeys, startPasskeyLogin, startPasskeyRegistration } from './passkey.service.js';

export const register = catchAsync(async (req, res) => sendData(res, await registerUser(req.body), 201));
export const login = catchAsync(async (req, res) => sendData(res, await loginUser(req.body)));
export const me = catchAsync(async (req, res) => sendData(res, await getCurrentUser(req.user.id)));
export const updateMe = catchAsync(async (req, res) => sendData(res, await updateProfile(req.user.id, req.body)));
export const firstPassword = catchAsync(async (req, res) => sendData(res, await setFirstPassword(req.user.id, req.body)));

export const passkeyRegisterOptions = catchAsync(async (req, res) => sendData(res, await startPasskeyRegistration(req.user.id)));
export const passkeyRegisterVerify = catchAsync(async (req, res) => sendData(res, await finishPasskeyRegistration(req.user.id, req.body), 201));
export const passkeyLoginOptions = catchAsync(async (_req, res) => sendData(res, await startPasskeyLogin()));
export const passkeyLoginVerify = catchAsync(async (req, res) => sendData(res, await finishPasskeyLogin(req.body)));
export const passkeyRemove = catchAsync(async (req, res) => {
  await removePasskeys(req.user.id);
  res.status(204).end();
});
