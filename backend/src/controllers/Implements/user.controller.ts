// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/implements/user.service';

const service = new UserService();

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = (req as any).user?._id?.toString();
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { username } = req.body || {};
    if (typeof username === 'undefined') {
      return res.status(400).json({ success: false, message: 'username is required' });
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
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return next(err);
  }
}
