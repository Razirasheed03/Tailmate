// backend/src/routes/connect.onboard.route.ts
import { Router } from "express";
import Stripe from "stripe";
import { stripe } from "../utils/stripe";
// import Doctor model and persist the connected account id on successful onboarding

const router = Router();

// POST /api/connect/accounts (create account and onboarding link)
router.post("/connect/accounts", async (req, res, next) => {
  try {
    // 1) Create Standard connected account and request capabilities
    const account = await stripe.accounts.create({
      type: "standard",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 2) Create onboarding link
    const link = await stripe.accountLinks.create({
      account: account.id,
      type: "account_onboarding",
      refresh_url: `${process.env.APP_URL}/connect/refresh`,
      return_url: `${process.env.APP_URL}/connect/return`,
    });

    // TODO: store account.id (acct_...) on the doctor record after return_url check
    return res.json({ success: true, data: { accountId: account.id, url: link.url } });
  } catch (err) {
    next(err);
  }
});

export default router;
