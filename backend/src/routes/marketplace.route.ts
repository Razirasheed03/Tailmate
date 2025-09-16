// src/routes/marketplace.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { authJwt } from '../middlewares/authJwt';
import { asyncHandler } from '../utils/asyncHandler';
import { MarketplaceController } from '../controllers/Implements/marketplace.controller';
import { uploadMarketplaceImageBufferToCloudinary } from '../utils/uploadToCloudinary';

const router = Router();
const c = new MarketplaceController();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});
router.use(authJwt);
router.get('/listings', asyncHandler(c.listPublic));
router.get('/listings/mine', asyncHandler(c.listMine));
router.put('/listings/:id', asyncHandler(c.update));
router.patch('/listings/:id', asyncHandler(c.update));
router.patch('/listings/:id/status',asyncHandler(c.changeStatus));
router.patch('/listings/:id/complete', asyncHandler(c.markComplete));
router.post('/listings/:id/status', asyncHandler(c.changeStatus));
router.post('/listings', asyncHandler(c.create));
router.delete('/listings/:id', asyncHandler(c.remove));

router.post(
  '/listings/photo',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file' });
    }
    const filename = req.file.originalname || `listing-${Date.now()}.jpg`;
    const { secure_url } = await uploadMarketplaceImageBufferToCloudinary(req.file.buffer, filename);
    return res.json({ success: true, url: secure_url });
  })
);

export default router;
