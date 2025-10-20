import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import httpClient from "@/services/httpClient";

type SessionView = {
  id: string;
  payment_status: "paid" | "unpaid" | "no_payment_required" | string;
  payment_intent?: string | null;
  // doctor
  bookingId?: string | null;
  // marketplace
  kind?: string | null;
  orderId?: string | null;
  listingId?: string | null;
};

type PaymentView = {
  _id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  doctorEarning: number;
  currency: string;
  paymentStatus: "pending" | "success" | "failed";
  createdAt: string;
};

export default function Success() {
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id") || "";
  const qOrderId = sp.get("orderId") || "";
  const qListingId = sp.get("listingId") || "";

  const [state, setState] = useState<{
    loading: boolean;
    msg: string;
    session?: SessionView;
    payment?: PaymentView;
    confirmed?: boolean;
  }>({ loading: true, msg: "Verifying payment..." });

  useEffect(() => {
    let active = true;

    async function pollMarketplace(orderId?: string | null, listingId?: string | null) {
      const started = Date.now();
      async function tick() {
        if (!active) return;
        try {
          // Prefer order polling for explicit paid status
          if (orderId) {
            const o = await httpClient.get<{ success: boolean; data: any }>(
              `/marketplace/orders/${orderId}`
            );
            const od = o?.data?.data;
            if (od?.status === "paid") {
              setState((s) => ({
                ...s,
                loading: false,
                msg: "Payment confirmed",
                confirmed: true,
              }));
              return;
            }
          }
          // Fallback: listing closed means ownership flip done
          if (listingId) {
            const l = await httpClient.get<{ success: boolean; data: any }>(
              `/marketplace/listings/${listingId}`
            );
            const ld = l?.data?.data;
            if (ld?.status === "closed") {
              setState((s) => ({
                ...s,
                loading: false,
                msg: "Payment confirmed",
                confirmed: true,
              }));
              return;
            }
          }
        } catch {
          // ignore and retry within window
        }
        if (Date.now() - started < 30000) {
          setTimeout(tick, 2000);
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            msg: "Processing… still waiting on webhook",
          }));
        }
      }
      tick();
    }

    async function load() {
      if (!sessionId) {
        setState({ loading: false, msg: "Missing session id" });
        return;
      }

      try {
        // 1) Read Checkout Session (server proxies Stripe and returns metadata)
        const ses = await httpClient.get<{ success: boolean; data: SessionView }>(
          `/checkout/session/${sessionId}`
        );
        const session = ses?.data?.data;
        if (!active) return;

        console.log("Success page session:", session);

        // Detect marketplace by metadata or URL hints
        const isMarketplace =
          session?.kind === "marketplace" || !!qOrderId || !!qListingId;
        const orderId = session?.orderId || qOrderId || null;
        const listingId = session?.listingId || qListingId || null;

        if (isMarketplace) {
          // If already paid, we still poll to ensure backend fulfillment is done
          setState({ loading: true, msg: "Completing marketplace order…", session });
          await pollMarketplace(orderId, listingId);
          return;
        }

        // Doctor flow (existing)
        const bookingId = session?.bookingId || "";
        if (bookingId) {
          try {
            const pay = await httpClient.get<{ success: boolean; data: PaymentView }>(
              `/payments/by-booking/${bookingId}`
            );
            console.log("Success page payment by booking:", pay?.data?.data);
            if (!active) return;
            const payment = pay?.data?.data;
            if (payment?.paymentStatus === "success") {
              setState({
                loading: false,
                msg: "Payment confirmed",
                session,
                payment,
                confirmed: true,
              });
              return;
            }
          } catch {
            // fall through
          }
        }

        // Generic fallback
        const paid = session?.payment_status === "paid";
        setState({
          loading: false,
          msg: paid
            ? "Payment processing... Please wait a moment and refresh if needed."
            : "Awaiting payment confirmation...",
          session,
        });
      } catch {
        setState({
          loading: false,
          msg: "Could not verify payment. Please refresh or contact support.",
        });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [sessionId, qOrderId, qListingId]);

  if (state.loading) {
    return <div className="p-6">{state.msg}</div>;
  }

  // Doctor success UI
  if (state.payment && state.payment.paymentStatus === "success") {
    const p = state.payment;
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Payment Successful</h2>
        <div className="text-sm text-gray-700 space-y-1">
          <div>Booking ID: {p.bookingId}</div>
          <div>Status: {p.paymentStatus}</div>
          <div>Total Paid: {p.currency} {p.amount}</div>
          <div>Doctor Earning: {p.currency} {p.doctorEarning}</div>
          <div>Platform Fee: {p.currency} {p.platformFee}</div>
          <div>Created: {new Date(p.createdAt).toLocaleString()}</div>
        </div>
        <div className="mt-4">
          <Link to="/vets" className="text-teal-600 underline">Back to Vets</Link>
        </div>
      </div>
    );
  }

  // Generic success/processing UI for marketplace or fallback
  const paid = state.session?.payment_status === "paid";
  const marketplaceConfirmed = state.confirmed;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Payment Status</h2>
      <div className="text-sm text-gray-700 space-y-1">
        <div>Session: {state.session?.id || "—"}</div>
        <div>Stripe Status: {state.session?.payment_status || "unknown"}</div>
        <div className="mt-2">{marketplaceConfirmed ? "Payment confirmed" : state.msg}</div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 rounded border bg-gray-50"
        >
          Refresh
        </button>
        <Link to="/" className="px-3 py-2 rounded border bg-white">
          Home
        </Link>
      </div>
      {!marketplaceConfirmed && paid && (
        <div className="mt-3 text-xs text-gray-500">
          If this stays here, the webhook may be delayed; try again in a few seconds.
        </div>
      )}
    </div>
  );
}
