import { Request, Response, NextFunction } from 'express';
import { MarketplaceService } from '../../services/implements/marketplace.service';

const svc = new MarketplaceService();

export class MarketplaceController {
 create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id?.toString();
    console.log('Auth user:', (req as any).user); // DEBUG
    console.log('Request body:', req.body); // DEBUG
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No authenticated user' });
    }
    
    const listing = await svc.create(userId, req.body || {});
    res.status(201).json({ success: true, data: listing });
  } catch (err) { 
    console.error('Create listing error:', err); // DEBUG
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
      const result = await svc.listPublic(page, limit, type, q, place);
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
      if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const status = req.body?.status as 'active' | 'reserved' | 'closed';
      if (!['active', 'reserved', 'closed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      const updated = await svc.changeStatus(userId, id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const ok = await svc.remove(userId, id);
      if (!ok) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
