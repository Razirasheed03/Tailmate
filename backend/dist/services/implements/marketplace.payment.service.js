"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplacePaymentService = void 0;
// backend/src/services/implements/marketplace.payment.service.ts
const mongoose_1 = require("mongoose");
const stripe_1 = require("../../utils/stripe");
const marketOrder_schema_1 = require("../../schema/marketOrder.schema");
const marketplaceListing_schema_1 = require("../../schema/marketplaceListing.schema");
class MarketplacePaymentService {
    createCheckoutSession(payload, buyerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { listingId } = payload || {};
            if (!listingId || !mongoose_1.Types.ObjectId.isValid(listingId))
                throw new Error("Invalid listing");
            const listing = yield marketplaceListing_schema_1.MarketplaceListing.findById(listingId).lean();
            if (!listing || listing.status !== "active")
                throw new Error("Listing unavailable");
            if (listing.type !== "sell")
                throw new Error("Listing is not for sale");
            if (!listing.petId)
                throw new Error("Listing missing petId");
            const amount = Number(listing.price || 0);
            if (amount <= 0)
                throw new Error("Invalid amount");
            const sellerId = String(listing.sellerId || listing.userId);
            // Create order
            const order = yield marketOrder_schema_1.MarketOrder.create({
                listingId: listing._id,
                petId: listing.petId,
                buyerId: new mongoose_1.Types.ObjectId(buyerId),
                sellerId: new mongoose_1.Types.ObjectId(sellerId),
                amount,
                currency: "INR",
                status: "created",
            });
            // Stripe Checkout Session (collect to platform)
            const session = yield stripe_1.stripe.checkout.sessions.create({
                mode: "payment",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "inr",
                            product_data: { name: listing.title },
                            unit_amount: Math.round(amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.APP_URL}/payments/Success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
                cancel_url: `${process.env.APP_URL}/payments/cancel?orderId=${order._id}`,
                metadata: {
                    kind: "marketplace",
                    orderId: String(order._id),
                    listingId: String(listing._id),
                    petId: String(listing.petId),
                    buyerId: String(buyerId),
                    sellerId: String(sellerId),
                },
            }, { idempotencyKey: `mp-chk:${order._id}:${buyerId}` });
            yield marketOrder_schema_1.MarketOrder.findByIdAndUpdate(order._id, { stripeSessionId: session.id });
            return { url: (_a = session.url) !== null && _a !== void 0 ? _a : null, orderId: String(order._id) };
        });
    }
}
exports.MarketplacePaymentService = MarketplacePaymentService;
