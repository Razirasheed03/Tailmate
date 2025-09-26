// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/implements/user.service';
import { HttpStatus } from '../../constants/httpStatus';

const service = new UserService();

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = (req as any).user?._id?.toString();
    if (!uid) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const { username } = req.body || {};
    if (!username) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'username is required' });
    }

    const user = await service.updateMyUsername(uid, username);
    return res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      // duplicate key on unique index
      return res.status(HttpStatus.CONFLICT).json({ success: false, message: 'Username already taken' });
    }
    if (err?.name === 'ValidationError') {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
    }
    return next(err);
  }
}
export async function listDoctors(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const search = String(req.query.search || "");
    const specialty = String(req.query.specialty || "");
    const result = await service.listDoctorsWithNextSlot({ page, limit, search, specialty });
    return res.status(HttpStatus.OK).json({ success: true, data: { items: result.items, total: result.total } });
  } catch (err) {
    return next(err);
  }
}
export async function getVetDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'id is required' });
    const data = await service.getDoctorPublicById(id);
    if (!data) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Doctor not found' });
    return res.status(HttpStatus.OK).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

export async function getVetSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const status = req.query.status === 'available' || req.query.status === 'booked' ? String(req.query.status) : undefined;
    if (!id || !from || !to) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'id, from and to are required' });
    }
    const data = await service.listDoctorSlotsBetween(id, { from, to});
    return res.status(HttpStatus.OK).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}