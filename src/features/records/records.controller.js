import { catchAsync } from '../../utils/catch-async.js';
import { sendData } from '../../utils/http-response.js';
import { getRecord, listRecords } from './record-query.service.js';
import { finishRecord, reopenRecord, suspendRecord } from './record-status.service.js';
import { upsertRecord } from './record-upsert.service.js';

const ids = (req) => [req.user.id, req.params.childId, req.params.date];

export const list = catchAsync(async (req, res) => sendData(res, await listRecords(req.user.id, req.params.childId, req.valid.query)));
export const getOne = catchAsync(async (req, res) => sendData(res, await getRecord(...ids(req))));
export const save = catchAsync(async (req, res) => sendData(res, await upsertRecord(...ids(req), req.body)));
// Fechar/suspender devolve o dia e, se a semana ficou completa, o relatório que começou a ser gerado.
const withReport = ({ record, weekReport }) => ({ ...record.toJSON(), weekReport });
export const finish = catchAsync(async (req, res) => sendData(res, withReport(await finishRecord(...ids(req)))));
export const suspend = catchAsync(async (req, res) => sendData(res, withReport(await suspendRecord(...ids(req), req.body))));
export const reopen = catchAsync(async (req, res) => sendData(res, await reopenRecord(...ids(req))));
