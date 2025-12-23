"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceController = void 0;
const marketplace_controller_1 = require("../controllers/Implements/marketplace.controller");
const marketplace_service_1 = require("../services/implements/marketplace.service");
const marketplace_repository_1 = require("../repositories/implements/marketplace.repository");
exports.marketplaceController = new marketplace_controller_1.MarketplaceController(new marketplace_service_1.MarketplaceService(new marketplace_repository_1.MarketplaceRepository()));
