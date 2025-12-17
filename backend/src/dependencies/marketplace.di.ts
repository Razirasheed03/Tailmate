import { MarketplaceController } from "../controllers/Implements/marketplace.controller";
import { MarketplaceService } from "../services/implements/marketplace.service";
import { MarketplaceRepository } from "../repositories/implements/marketplace.repository";

export const marketplaceController = new MarketplaceController(
  new MarketplaceService(new MarketplaceRepository())
);
