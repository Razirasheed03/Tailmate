// src/pages/payments/Success.tsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import httpClient from "@/services/httpClient";

type SessionView = {
  id: string;
  payment_status: "paid" | "unpaid" | "no_payment_required" | string;
  bookingId?: string;
  payment_intent?: string;
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
  const sessionId = sp.get("session_id");

  const [state, setState] = useState<{
    loading: boolean;
    msg: string;
    session?: SessionView;
    payment?: PaymentView;
  }>({ loading: true, msg: "Verifying payment..." });

  useEffect(() => {
    let active = true;

    async function load() {
      if (!sessionId) {
        setState({ loading: false, msg: "Missing session id" });
        return;
      }

      try {
        // 1) Read Checkout Session (server endpoint that proxies Stripe)
        const ses = await httpClient.get<{ success: boolean; data: SessionView }>(
          `/checkout/session/${sessionId}`
        );
        const session = ses?.data?.data;

        // ✅ Added log for debugging
        console.log("Success page session:", session);

        const bookingId = session?.bookingId;

        // 2) If webhook already handled it, read Payment by bookingId (optional for UX)
        if (bookingId) {
          try {
            const pay = await httpClient.get<{ success: boolean; data: PaymentView }>(
              `/payments/by-booking/${bookingId}`
            );

            // ✅ Added log for debugging
            console.log("Success page payment by booking:", pay?.data?.data);

            if (!active) return;
            const payment = pay?.data?.data;

            // If payment succeeded, render confirmation
            if (payment?.paymentStatus === "success") {
              setState({
                loading: false,
                msg: "Payment confirmed",
                session,
                payment,
              });
              return;
            }
          } catch {
            // Not found yet -> webhook might not have updated; fall through to message
          }
        }

        // 3) If Session says paid but Payment not yet visible, show processing message
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
  }, [sessionId]);

  if (state.loading) {
    return <div className="p-6">{state.msg}</div>;
  }

  // If we have a confirmed Payment row
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

  // Fallback UI if webhook still in-flight
  const paid = state.session?.payment_status === "paid";
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Payment Status</h2>
      <div className="text-sm text-gray-700 space-y-1">
        <div>Session: {state.session?.id || "—"}</div>
        <div>Stripe Status: {state.session?.payment_status || "unknown"}</div>
        <div className="mt-2">{state.msg}</div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 rounded border bg-gray-50"
        >
          Refresh
        </button>
        <Link to="/vets" className="px-3 py-2 rounded border bg-white">
          Back to Vets
        </Link>
      </div>
      {paid && (
        <div className="mt-3 text-xs text-gray-500">
          If this stays here, the webhook may be delayed; try again in a few seconds.
        </div>
      )}
    </div>
  );
}
