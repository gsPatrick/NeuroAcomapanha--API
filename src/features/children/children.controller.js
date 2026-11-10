import { catchAsync } from '../../utils/catch-async.js';
import { sendData } from '../../utils/http-response.js';
import { createChild, deleteChild, getOwnedChild, listChildren, syncChildren, updateChild } from './children.service.js';

export const list = catchAsync(async (req, res) => sendData(res, await listChildren(req.user.id)));
export const getOne = catchAsync(async (req, res) => sendData(res, await getOwnedChild(req.user.id, req.params.childId)));
export const sync = catchAsync(async (req, res) => sendData(res, await syncChildren(req.user.id, req.body.children)));
export const create = catchAsync(async (req, res) => sendData(res, await createChild(req.user.id, req.body), 201));
export const update = catchAsync(async (req, res) => sendData(res, await updateChild(req.user.id, req.params.childId, req.body)));
export const remove = catchAsync(async (req, res) => {
  await deleteChild(req.user.id, req.params.childId);
  res.status(204).end();
});
