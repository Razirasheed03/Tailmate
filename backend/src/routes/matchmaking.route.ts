import { Router } from "express";
import multer from "multer";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { MatchmakingController } from "../controllers/Implements/matchmaking.controller";
import { uploadMarketplaceImageBufferToCloudinary } from "../utils/uploadToCloudinary";

const router = Router();
const c = new MatchmakingController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.use(authJwt);

router.get("/list", asyncHandler(c.listPublic));
router.get("/mine", asyncHandler(c.listMine));
router.post("/", asyncHandler(c.create));
router.put("/:id", asyncHandler(c.update));
router.patch("/:id/status", asyncHandler(c.changeStatus));
router.delete("/:id", asyncHandler(c.remove));

router.post(
  "/photo",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file" });

    const filename = req.file.originalname || `match-${Date.now()}.jpg`;
    const { secure_url } = await uploadMarketplaceImageBufferToCloudinary(
      req.file.buffer,
      filename
    );

    res.json({ success: true, url: secure_url });
  })
);

export default router;
