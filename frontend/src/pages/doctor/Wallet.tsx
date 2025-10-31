// src/pages/doctor/Wallet.tsx
import { useEffect, useState, useMemo } from "react";
import { paymentService } from "@/services/paymentService";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

type PaymentRow = {
  _id: string;
  amount: number;
  platformFee: number;
  doctorEarning: number;
  currency: string;
  bookingId: string;
  paymentStatus: "pending" | "success" | "failed";
  createdAt: string;
};

export default function DoctorWallet() {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const total = useMemo(
    () =>
      items
        .filter((i) => i.paymentStatus === "success")
        .reduce((s, i) => s + (i.doctorEarning || 0), 0),
    [items]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await paymentService.listDoctorPayments();
        if (!active) return;
        // Normalize to array just in case service changes
        const data = Array.isArray(rows)
          ? rows
          : Array.isArray((rows as any)?.data)
          ? (rows as any).data
          : [];
        setItems(data as PaymentRow[]);
      } catch (e: any) {
        setErr(e?.message || "Failed to load payments");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex h-screen">
        <DoctorSidebar isVerified={true} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-3">Wallet</h2>

            {err && (
              <div className="mb-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">
                {err}
              </div>
            )}

            <div className="mb-4 bg-white border rounded p-4">
              <div className="text-sm text-gray-500">Current Balance (net)</div>
              <div className="text-2xl font-semibold">{formatINR(total)}</div>
            </div>

            <div className="bg-white border rounded p-4">
              <div className="text-sm font-semibold mb-2">Recent Payments</div>
              <ul className="divide-y">
                {items.map((it) => (
                  <li
                    key={it._id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="text-sm">
                      <div className="font-medium">
                        {it.paymentStatus === "success"
                          ? "Booking earning"
                          : it.paymentStatus}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(it.createdAt).toLocaleString()} • Booking{" "}
                        {it.bookingId}
                      </div>
                    </div>
                    <div className="text-sm text-emerald-700">
                      + {formatINR(it.doctorEarning)}
                    </div>
                  </li>
                ))}
                {items.length === 0 && !loading && (
                  <li className="py-6 text-sm text-gray-500 text-center">
                    No payments yet
                  </li>
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
