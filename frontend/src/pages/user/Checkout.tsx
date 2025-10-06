// src/pages/user/Checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { vetsService } from "@/services/vetsService";
import { checkoutService, type CreateCheckoutPayload, type PaymentMethod } from "@/services/checkoutService";
import { PetSelectDialog } from "@/pages/pets/PetSelectDialog";

type BookingState = {
  doctorId: string;
  doctorName?: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  durationMins: number;
  mode: "video" | "audio" | "inPerson";
  fee: number;           // slot fee from VetDetail
};

type PickedPet = { _id: string; name: string; photoUrl?: string };

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

  // Guard: redirect if incomplete
  useEffect(() => {
    if (!ctx?.doctorId || !ctx?.date || !ctx?.time) {
      nav("/vets", { replace: true });
    }
  }, [ctx, nav]);

  // Doctor summary
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
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [ctx?.doctorId, doctorName]);

  // Pet selection
  const [pickedPet, setPickedPet] = useState<PickedPet | null>(null);
  const [petDialogOpen, setPetDialogOpen] = useState(false);

  // Notes + payment
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [loading, setLoading] = useState(false);

  const whenText = useMemo(() => (ctx ? formatDateLabel(ctx.date, ctx.time) : ""), [ctx]);

  // Minimal toast
  const [toast, setToast] = useState<{ type: "error" | "info"; msg: string } | null>(null);
  function showError(msg: string) { setToast({ type: "error", msg }); setTimeout(() => setToast(null), 3500); }

  // Revalidate slot before quote/create to avoid stale selection
  async function verifySelectedSlot() {
    if (!ctx) return null;
    const day = ctx.date;
    const daySlots = await vetsService.getDoctorSlots(ctx.doctorId, { from: day, to: day, status: "available" });
    const match = daySlots.find(s =>
      s.date === ctx.date &&
      s.time === ctx.time &&
      s.durationMins === ctx.durationMins &&
      s.modes.includes(ctx.mode)
    );
    return match || null;
  }

  const canPay = !!ctx && !!pickedPet && !loading;

  async function onCreateCheckout() {
    if (!ctx || !pickedPet) return;

    setLoading(true);
    try {
      // 1) Preflight availability
      const fresh = await verifySelectedSlot();
      if (!fresh) {
        showError("This time is no longer available. Please pick another slot.");
        return;
      }

      // 2) Quote with fresh fee (in case of recent changes)
      const quote = await checkoutService.getQuote({
        doctorId: ctx.doctorId,
        date: ctx.date,
        time: ctx.time,
        durationMins: ctx.durationMins,
        mode: ctx.mode,
        baseFee: fresh.fee,
      });

      // 3) Create checkout (add pet context)
      const payload: CreateCheckoutPayload & { petId?: string; petName?: string } = {
        doctorId: ctx.doctorId,
        date: ctx.date,
        time: ctx.time,
        durationMins: ctx.durationMins,
        mode: ctx.mode,
        amount: quote.totalAmount,
        currency: quote.currency ?? "INR",
        petName: pickedPet.name,  // keep legacy petName
        paymentMethod,
        notes: notes.trim(),
        petId: pickedPet._id,     // optional if backend accepts it
      };

      const res = await checkoutService.createCheckout(payload);

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      if (res.bookingId) {
        // Dev path: mock pay and go to confirmation
        const paid = await checkoutService.mockPay(res.bookingId);
        nav("/booking/confirm", {
          state: {
            bookingId: res.bookingId,
            status: paid.status,
            doctorName: doctorName || ctx.doctorId,
            ...payload,
          },
        });
        return;
      }

      // Defensive fallback
      nav("/vets", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Could not create payment. Please try another time.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7fafb]">
      <Navbar />
      {toast && (
        <div className="mx-auto mt-3 max-w-3xl px-4">
          <div className={`text-sm rounded border px-3 py-2 ${toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-sky-50 border-sky-200 text-sky-800"}`}>
            {toast.msg}
          </div>
        </div>
      )}
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

                {/* Scheduled time */}
                <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded px-3 py-2 text-sm">
                  <div className="text-emerald-800">Scheduled Time</div>
                  <div className="text-emerald-900 font-medium">{ctx ? whenText : "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pet selection + notes */}
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Pet Details</div>

            <label className="block text-xs text-gray-600 mb-1">Choose Pet</label>
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => setPetDialogOpen(true)}
                className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                {pickedPet ? "Change pet" : "Select pet"}
              </button>
              {pickedPet && (
                <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                  {pickedPet.photoUrl && (
                    <img
                      src={pickedPet.photoUrl}
                      alt=""
                      className="w-7 h-7 rounded object-cover border"
                    />
                  )}
                  <div className="text-sm">
                    <div className="font-medium leading-tight">{pickedPet.name}</div>
                    <div className="text-xs text-gray-500 leading-tight">{pickedPet._id}</div>
                  </div>
                </div>
              )}
            </div>

            <PetSelectDialog
              open={petDialogOpen}
              onClose={() => setPetDialogOpen(false)}
              onPick={(p: PickedPet) => setPickedPet(p)}
            />

            <label className="block text-xs text-gray-600 mb-1">Notes for the vet (optional)</label>
            <textarea
              rows={4}
              placeholder="Describe symptoms or reason for consultation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
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
                disabled={!canPay}
                onClick={onCreateCheckout}
                className="w-full px-4 py-3 rounded bg-teal-600 text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : `Proceed to Payment • ₹${ctx?.fee ?? 0}`}
              </button>
              {!pickedPet && (
                <div className="text-xs text-rose-600 mt-2">Please select a pet to continue.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
