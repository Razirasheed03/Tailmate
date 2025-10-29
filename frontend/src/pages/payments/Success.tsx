import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import httpClient from "@/services/httpClient";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Home,
  Stethoscope,
  Store,
} from "lucide-react";

type SessionView = {
  id: string;
  payment_status: "paid" | "unpaid" | "no_payment_required" | string;
  payment_intent?: string | null;
  // doctor
  bookingId?: string | null;
  // marketplace
  kind?: "marketplace" | "doctor" | string | null;
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

type UiState =
  | { phase: "loading"; title: string; subtitle?: string; hint?: string }
  | { phase: "success"; title: string; subtitle?: string; hint?: string }
  | { phase: "processing"; title: string; subtitle?: string; hint?: string }
  | { phase: "error"; title: string; subtitle?: string; hint?: string };

function currency(amount: number, code: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
    }).format(safe);
  } catch {
    return `${code} ${safe}`;
  }
}

// function maskId(id?: string | null) {
//   if (!id) return "—";
//   if (id.length <= 10) return id;
//   return `${id.slice(0, 6)}…${id.slice(-4)}`;
// }

export default function Success() {
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id") || "";
  const qOrderId = sp.get("orderId") || "";
  const qListingId = sp.get("listingId") || "";

  const [session, setSession] = useState<SessionView | undefined>(undefined);
  const [payment, setPayment] = useState<PaymentView | undefined>(undefined);
  const [marketplaceConfirmed, setMarketplaceConfirmed] = useState(false);
  const [ui, setUi] = useState<UiState>({
    phase: "loading",
    title: "Verifying payment…",
  });

  const isMarketplace = useMemo(
    () => session?.kind === "marketplace" || !!qOrderId || !!qListingId,
    [session?.kind, qOrderId, qListingId]
  );

  // Stable key to avoid duplicate marketplace polls
  const pollKey = useMemo(() => {
    if (!isMarketplace) return "";
    const oid = session?.orderId || qOrderId || "";
    const lid = session?.listingId || qListingId || "";
    return `${oid}|${lid}`;
  }, [
    isMarketplace,
    session?.orderId,
    session?.listingId,
    qOrderId,
    qListingId,
  ]);

  // Marketplace polling (debounced by pollKey)
  useEffect(() => {
    let active = true;
    if (!isMarketplace || !pollKey) return;

    const orderId = session?.orderId || qOrderId || null;
    const listingId = session?.listingId || qListingId || null;

    async function poll() {
      const start = Date.now();
      setUi({
        phase: "processing",
        title: "Completing your order…",
        subtitle: "This usually takes a few seconds.",
      });

      async function tick() {
        if (!active) return;
        try {
          if (orderId) {
            const o = await httpClient.get<{ success: boolean; data: any }>(
              `/marketplace/orders/${orderId}`
            );
            const od = o?.data?.data;
            if (od?.status === "paid") {
              setMarketplaceConfirmed(true);
              setUi({
                phase: "success",
                title: "Payment successful",
                subtitle: "Your order has been confirmed.",
              });
              return;
            }
          }
          if (listingId) {
            const l = await httpClient.get<{ success: boolean; data: any }>(
              `/marketplace/listings/${listingId}`
            );
            const ld = l?.data?.data;
            if (ld?.status === "closed") {
              setMarketplaceConfirmed(true);
              setUi({
                phase: "success",
                title: "Payment successful",
                subtitle: "The listing is now closed.",
              });
              return;
            }
          }
        } catch {
          // ignore and retry
        }
        if (Date.now() - start < 45000) {
          setTimeout(tick, 2000);
        } else {
          setUi({
            phase: "processing",
            title: "Almost there…",
            subtitle: "We’re still finishing up your order.",
            hint: "If this doesn’t update, please refresh in a moment.",
          });
        }
      }
      tick();
    }

    poll();
    return () => {
      active = false;
    };
  }, [isMarketplace, pollKey]);

  // Load and decide state (doctor and shared parts)
  useEffect(() => {
    let active = true;

    async function load() {
      if (!sessionId) {
        setUi({
          phase: "error",
          title: "Missing session id",
          hint: "Return to Home and try again.",
        });
        return;
      }
      try {
        const ses = await httpClient.get<{
          success: boolean;
          data: SessionView;
        }>(`/checkout/session/${sessionId}`);
        const s = ses?.data?.data;
        if (!active) return;
        setSession(s);

        // Marketplace handled by separate effect
        if (s?.kind === "marketplace" || qOrderId || qListingId) {
          setUi({
            phase: s?.payment_status === "paid" ? "processing" : "loading",
            title:
              s?.payment_status === "paid"
                ? "Payment received"
                : "Verifying payment…",
            subtitle:
              s?.payment_status === "paid" ? "Securing your order…" : undefined,
          });
          return;
        }

        // Doctor path: try reading Payment row directly
        const bookingId = s?.bookingId || "";
        if (bookingId) {
          try {
            const payRes = await httpClient.get<{
              success: boolean;
              data: PaymentView;
            }>(`/payments/by-booking/${bookingId}`);
            const p = payRes?.data?.data;
            if (!active) return;

            if (p?.paymentStatus === "success") {
              setPayment(p);
              setUi({
                phase: "success",
                title: "Payment successful",
                subtitle: "Your session has been confirmed.",
              });
              return;
            }
          } catch {
            // ignore and fall through to short poll
          }
        }

        // Fallback by Stripe session status, plus short poll for doctor flow
        if (s?.payment_status === "paid") {
          setUi({
            phase: "processing",
            title: "Finalizing your booking…",
            subtitle: "This may take a few seconds.",
            hint: "If this doesn’t update, please refresh in a moment.",
          });
          // Short doctor poll (15s) to catch webhook completion
          if (s?.bookingId) {
            const t0 = Date.now();
            const poll = async () => {
              if (!active) return;
              try {
                const payRes = await httpClient.get<{
                  success: boolean;
                  data: PaymentView;
                }>(`/payments/by-booking/${s.bookingId}`);
                const p = payRes?.data?.data;
                if (p?.paymentStatus === "success") {
                  setPayment(p);
                  setUi({
                    phase: "success",
                    title: "Payment successful",
                    subtitle: "Your session has been confirmed.",
                  });
                  return;
                }
              } catch {
                // ignore
              }
              if (Date.now() - t0 < 15000) setTimeout(poll, 1500);
            };
            poll();
          }
        } else {
          setUi({ phase: "loading", title: "Verifying payment…" });
        }
      } catch {
        setUi({
          phase: "error",
          title: "We couldn’t verify your payment",
          hint: "Please refresh this page or contact support.",
        });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [sessionId, qOrderId, qListingId]);

  // Header icon
  function HeaderIcon() {
    if (ui.phase === "success")
      return <CheckCircle2 className="w-10 h-10 text-emerald-600" />;
    if (ui.phase === "processing" || ui.phase === "loading")
      return <Clock className="w-10 h-10 text-amber-600" />;
    return <AlertTriangle className="w-10 h-10 text-rose-600" />;
  }

  // Summary block
  function Summary() {
    if (payment && ui.phase === "success") {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-emerald-700">Booking Id:</span>{" "}
              {payment.bookingId}
            </div>
            <div>
              <span className="text-emerald-700">Status:</span>{" "}
              {payment.paymentStatus}
            </div>
          </div>
        </div>
      );
    }

    if (
      isMarketplace &&
      (marketplaceConfirmed || session?.payment_status === "paid")
    ) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-blue-700">Order:</span>{" "}
              {session?.orderId || qOrderId}
            </div>
            <div>
              <span className="text-blue-700">Listing:</span>{" "}
              {session?.listingId || qListingId}
            </div>
            <div>
              <span className="text-blue-700">Stripe:</span> {session?.id}
            </div>
            <div>
              <span className="text-blue-700">Status:</span>{" "}
              {marketplaceConfirmed ? "confirmed" : "processing"}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-600">Stripe session:</span> {session?.id}
          </div>
          <div>
            <span className="text-gray-600">Stripe status:</span>{" "}
            {session?.payment_status || "unknown"}
          </div>
        </div>
      </div>
    );
  }

  // Primary/secondary actions
  function Actions() {
    const primaryTo = isMarketplace ? "/" : "/vets";
    const primaryLabel = isMarketplace ? "Go to Home" : "Back to Vets";
    const PrimaryIcon = isMarketplace ? Home : Stethoscope;

    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={primaryTo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900"
        >
          <PrimaryIcon className="w-4 h-4" />
          {primaryLabel}
        </Link>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
        >
          <ExternalLink className="w-4 h-4" />
          Refresh
        </button>

        {isMarketplace && (
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
          >
            <Store className="w-4 h-4" />
            Browse Marketplace
          </Link>
        )}

        {payment && (
          <Link
            to="/vets"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
          >
            <Stethoscope className="w-4 h-4" />
            Book another session
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center">
      <div className="max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div
            className="flex items-start gap-4"
            role={
              ui.phase === "processing" || ui.phase === "loading"
                ? "status"
                : undefined
            }
            aria-live="polite"
          >
            <HeaderIcon />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{ui.title}</h1>
              {ui.subtitle && (
                <p className="text-sm text-gray-600 mt-1">{ui.subtitle}</p>
              )}
              {ui.hint && (
                <p className="text-xs text-gray-500 mt-1">{ui.hint}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Summary />
          </div>

          <Actions />

          <div className="mt-8 text-xs text-gray-500">
            {ui.phase === "success" ? (
              <p>
                A receipt has been issued by Stripe. If you don’t see it in your
                inbox, please check spam or contact support.
              </p>
            ) : ui.phase === "processing" ? (
              <p>
                Webhooks can take a few seconds to finalize. Your payment is
                safe—this will update automatically on refresh.
              </p>
            ) : ui.phase === "error" ? (
              <p>
                If this keeps happening, contact support with your Stripe
                session id {session?.id}.
              </p>
            ) : (
              <p>Verifying your payment details…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
