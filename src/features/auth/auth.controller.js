import { catchAsync } from '../../utils/catch-async.js';
import { sendData } from '../../utils/http-response.js';
import { getCurrentUser, loginUser, registerUser, updateProfile } from './auth.service.js';

export const register = catchAsync(async (req, res) => sendData(res, await registerUser(req.body), 201));
export const login = catchAsync(async (req, res) => sendData(res, await loginUser(req.body)));
export const me = catchAsync(async (req, res) => sendData(res, await getCurrentUser(req.user.id)));
export const updateMe = catchAsync(async (req, res) => sendData(res, await updateProfile(req.user.id, req.body)));
