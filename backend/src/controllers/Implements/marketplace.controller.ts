// src/controllers/marketplace.controller.ts
import { Request, Response, NextFunction } from 'express';
import { MarketplaceService } from '../../services/implements/marketplace.service';
import { HttpStatus } from '../../constants/httpStatus';

const svc = new MarketplaceService();

export class MarketplaceController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      console.log('Auth user:', (req as any).user)
      console.log('Request body:', req.body);
      
      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'No authenticated user' });
      }
      
      const listing = await svc.create(userId, req.body || {});
      res.status(HttpStatus.CREATED).json({ success: true, data: listing });
    } catch (err) { 
      console.error('Create listing error:', err);
      next(err); 
    }
  };

listPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const type = (req.query.type as string) || '';
    const q = (req.query.q as string) || '';
    const place = (req.query.place as string) || '';
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const excludeFree = req.query.excludeFree === 'true';
    const sortBy = (req.query.sortBy as string) || 'newest';
    
    const result = await svc.listPublic(page, limit, type, q, place, {
      minPrice,
      maxPrice,
      excludeFree,
      sortBy
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 12;
      const result = await svc.listMine(userId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const updated = await svc.update(userId, id, req.body || {});
      if (!updated) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };
  changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const status = req.body?.status;
      
      const validStatuses = ['active', 'reserved', 'closed', 'inactive', 'sold', 'adopted'];
      if (!validStatuses.includes(status)) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid status' });
      }
      
      const updated = await svc.changeStatus(userId, id, status);
      if (!updated) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };

  markComplete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const status = req.body?.status as 'sold' | 'adopted';
      
      if (!['sold', 'adopted'].includes(status)) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid completion status' });
      }
      
      const updated = await svc.markAsComplete(userId, id, status);
      if (!updated) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const ok = await svc.remove(userId, id);
      if (!ok) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Not found' });
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (err) { next(err); }
  };
}
