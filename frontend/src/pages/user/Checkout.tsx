// src/pages/user/Checkout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { vetsService } from "@/services/vetsService";
import { checkoutService, type CreateCheckoutPayload, type PaymentMethod } from "@/services/checkoutService";

type BookingState = {
  doctorId: string;
  doctorName?: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  durationMins: number;
  mode: "video" | "audio" | "inPerson";
  fee: number;
};

function formatDateLabel(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date + "T00:00:00Z");
  d.setHours(h, m, 0, 0);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Checkout() {
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingState };
  const ctx = location.state as BookingState | undefined;

  // Basic guards: if missing context, redirect back to vets list
  useEffect(() => {
    if (!ctx?.doctorId || !ctx?.date || !ctx?.time) {
      nav("/vets", { replace: true });
    }
  }, [ctx, nav]);

  // doctor profile (avatar/name fallback)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [doctorName, setDoctorName] = useState<string>(ctx?.doctorName || "");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!ctx?.doctorId) return;
      try {
        const d = await vetsService.getDoctor(ctx.doctorId);
        if (!mounted) return;
        setAvatarUrl(d?.avatarUrl);
        if (!doctorName && d?.displayName) setDoctorName(d.displayName);
      } catch {
        // ignore for now; backend wiring next
      }
    })();
    return () => { mounted = false; };
  }, [ctx?.doctorId, doctorName]);

  // Form state
  const [petName, setPetName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [loading, setLoading] = useState(false);

  const whenText = useMemo(() => (ctx ? formatDateLabel(ctx.date, ctx.time) : ""), [ctx]);

  async function onCreateCheckout() {
    if (!ctx) return;
    if (!petName.trim()) return;

    setLoading(true);
    try {
      // optional: fetch server quote first (tax/discounts)
      const quote = await checkoutService.getQuote({
        doctorId: ctx.doctorId,
        date: ctx.date,
        time: ctx.time,
        durationMins: ctx.durationMins,
        mode: ctx.mode,
        baseFee: ctx.fee,
      });

      const payload: CreateCheckoutPayload = {
        doctorId: ctx.doctorId,
        date: ctx.date,
        time: ctx.time,
        durationMins: ctx.durationMins,
        mode: ctx.mode,
        amount: quote.totalAmount ?? ctx.fee,
        currency: quote.currency ?? "INR",
        petName: petName.trim(),
        notes: notes.trim(),
        paymentMethod,
      };

      const res = await checkoutService.createCheckout(payload);
      // For now, if backend returns redirectUrl, send there; else navigate to a confirmation stub
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        nav("/booking/confirm", {
          state: {
            bookingId: res.bookingId,
            ...payload,
            doctorName: doctorName || ctx.doctorId,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7fafb]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left steps */}
        <aside className="bg-white border rounded-xl p-4 h-fit">
          <div className="text-sm font-medium mb-2">Therapy session with</div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={avatarUrl || "https://via.placeholder.com/48"}
              alt={doctorName || "Doctor"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-sm font-semibold">{doctorName || "Doctor"}</div>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Choose session details
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              Complete your booking
            </li>
          </ul>
        </aside>

        {/* Middle content */}
        <section className="lg:col-span-2 space-y-5">
          {/* Summary */}
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-semibold text-sky-700 mb-3">Session Summary</div>
            <div className="flex items-start gap-4">
              <img
                src={avatarUrl || "https://via.placeholder.com/64"}
                alt={doctorName || "Doctor"}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="flex-1">
                <div className="font-semibold">{doctorName || "Doctor"}</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                  <div>
                    <div className="text-gray-500 text-xs">Session Type</div>
                    <div>{ctx?.mode === "inPerson" ? "In‑Person" : ctx?.mode ? ctx.mode[0].toUpperCase() + ctx.mode.slice(1) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Duration</div>
                    <div>{ctx?.durationMins ?? "-"} minutes</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Session Fee</div>
                    <div>₹{ctx?.fee ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session info */}
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Session Information</div>

            <label className="block text-xs text-gray-600 mb-1">Select Pet</label>
            <input
              placeholder="Type pet name (e.g., Bruno)"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-xs text-gray-600 mb-1">Brief Description</label>
            <textarea
              rows={4}
              placeholder="Describe symptoms or reason for consultation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />

            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded px-3 py-2 text-sm">
              <div className="text-emerald-800">Scheduled Time</div>
              <div className="text-emerald-900 font-medium">
                {ctx ? whenText : "-"}
              </div>
            </div>
          </div>

          {/* Payment method + action */}
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Select Payment Method</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "upi", label: "UPI (GPay/PhonePe)" },
                { key: "card", label: "Credit/Debit Card" },
                { key: "netbanking", label: "NetBanking" },
                { key: "wallet", label: "Wallet" },
              ].map((p) => (
                <label
                  key={p.key}
                  className={`flex items-center gap-3 border rounded px-3 py-2 cursor-pointer ${
                    paymentMethod === p.key ? "border-teal-500 bg-teal-50" : "border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    className="accent-teal-600"
                    checked={paymentMethod === (p.key as PaymentMethod)}
                    onChange={() => setPaymentMethod(p.key as PaymentMethod)}
                  />
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-5">
              <button
                disabled={!ctx || !petName.trim() || loading}
                onClick={onCreateCheckout}
                className="w-full px-4 py-3 rounded bg-teal-600 text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : `Proceed to Payment • ₹${ctx?.fee ?? 0}`}
              </button>
              {!petName.trim() && (
                <div className="text-xs text-gray-500 mt-2">Please enter a pet name to continue.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
