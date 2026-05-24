// src/routes/marketplace.routes.ts
import { Router } from "express";
import multer from "multer";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { marketplaceController } from "../dependencies/marketplace.di";
import { uploadMarketplaceImageBufferToCloudinary } from "../utils/uploadToCloudinary";
import { MarketOrder } from "../schema/marketOrder.schema";
import { MarketplaceListing } from "../schema/marketplaceListing.schema";
import { tryFulfillMarketplaceOrderFromStripe } from "../services/implements/marketplaceOrderFulfillment.service";
import { env } from "../config/env";

const router = Router();
const c = marketplaceController;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.get("/listings", asyncHandler(c.listPublic));
router.get("/listings/mine", authJwt, asyncHandler(c.listMine));
router.get(
  "/listings/:id",
  asyncHandler(async (req, res) => {
    const row = await MarketplaceListing.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: row });
  })
);

router.put("/listings/:id", authJwt, asyncHandler(c.update));
router.patch("/listings/:id", authJwt, asyncHandler(c.update));
router.patch("/listings/:id/status", authJwt, asyncHandler(c.changeStatus));
router.patch("/listings/:id/complete", authJwt, asyncHandler(c.markComplete));
router.post("/listings/:id/status", authJwt, asyncHandler(c.changeStatus));
router.post("/listings", authJwt, asyncHandler(c.create));
router.delete("/listings/:id", authJwt, asyncHandler(c.remove));

router.post(
  "/listings/photo",
  authJwt,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file" });
    }
    const filename = req.file.originalname || `listing-${Date.now()}.jpg`;
    const { secure_url } = await uploadMarketplaceImageBufferToCloudinary(
      req.file.buffer,
      filename
    );
    return res.json({ success: true, url: secure_url });
  })
);

router.get(
  "/orders/:id",
  authJwt,
  asyncHandler(async (req, res) => {
    const userId = (req as any)?.user?._id?.toString();
    let row = await MarketOrder.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ success: false, message: "Not found" });

    const isParty =
      userId &&
      (String(row.buyerId) === userId || String(row.sellerId) === userId);
    if (!isParty) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!env.isProduction && row.status === "created" && row.stripeSessionId) {
      await tryFulfillMarketplaceOrderFromStripe(String(row._id), {
        sessionId: row.stripeSessionId,
      });
      row = await MarketOrder.findById(req.params.id).lean();
    }

    res.json({ success: true, data: row });
  })
);

export default router;
