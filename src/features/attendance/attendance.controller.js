import { catchAsync } from '../../utils/catch-async.js';
import { sendData } from '../../utils/http-response.js';
import { listAttendance } from './attendance.service.js';

export const list = catchAsync(async (req, res) => sendData(res, await listAttendance(req.user.id, req.valid.query)));
