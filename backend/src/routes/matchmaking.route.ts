import { Router } from "express";
import multer from "multer";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { matchmakingController } from "../dependencies/matchmaking.di";
import { uploadMarketplaceImageBufferToCloudinary } from "../utils/uploadToCloudinary";
import { MatchmakingListing } from "../schema/matchmaking.schema";

const router = Router();
const c = matchmakingController;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.get("/list", asyncHandler(c.listPublic));
router.get("/mine", authJwt, asyncHandler(c.listMine));
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await MatchmakingListing.findOne({
      _id: req.params.id,
      deletedAt: null,
      status: "active",
    }).lean();
    if (!row) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: row });
  })
);

router.post("/", authJwt, asyncHandler(c.create));
router.put("/:id", authJwt, asyncHandler(c.update));
router.patch("/:id/status", authJwt, asyncHandler(c.changeStatus));
router.delete("/:id", authJwt, asyncHandler(c.remove));

router.post(
  "/photo",
  authJwt,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file" });
    }

    const filename = req.file.originalname || `match-${Date.now()}.jpg`;
    const { secure_url } = await uploadMarketplaceImageBufferToCloudinary(
      req.file.buffer,
      filename
    );

    res.json({ success: true, url: secure_url });
  })
);

export default router;
