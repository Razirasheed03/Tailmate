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
