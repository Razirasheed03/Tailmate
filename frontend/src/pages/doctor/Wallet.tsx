import { useEffect, useState, useMemo } from "react";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { paymentService } from "@/services/paymentService";
import { doctorService } from "@/services/doctorService";
import { payoutService } from "@/services/payoutService";

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

type PayoutRecord = {
  _id: string;
  amount: number;
  createdAt: string;
  status: "pending" | "paid" | "failed";
};

function PayoutSection({ balance, onPayout }: { balance: number; onPayout: () => void }) {
  const [amount, setAmount] = useState(Math.floor(balance));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await payoutService.requestPayout(amount);
      setSuccess("Withdrawal initiated!");
      setAmount(Math.floor(balance));
      onPayout();
    } catch (err: any) {
      setError(err?.message || "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded p-4 mb-6">
      <h3 className="text-sm font-semibold mb-3">Withdraw Earnings</h3>
      <div className="mb-2">
        <input
          type="number"
          min={0}
          max={balance}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="border px-2 py-1 rounded w-32"
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
        disabled={loading || amount < 1 || amount > balance}
        onClick={handleWithdraw}
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>
      {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
      {success && <div className="mt-2 text-sm text-emerald-600">{success}</div>}
    </div>
  );
}

function PayoutHistory({ records }: { records: PayoutRecord[] }) {
  return (
    <div className="bg-white border rounded p-4 mb-6">
      <div className="text-sm font-semibold mb-2">Payout History</div>
      <ul className="divide-y">
        {records.map((it) => (
          <li key={it._id} className="py-3 flex items-center justify-between">
            <span className="text-sm">{new Date(it.createdAt).toLocaleString()}</span>
            <span className="font-medium">
              {formatINR(it.amount)} {it.status === "paid" ? "✅" : it.status === "failed" ? "❌" : "⏳"}
            </span>
          </li>
        ))}
        {records.length === 0 && (
          <li className="py-6 text-sm text-gray-500 text-center">No payout history yet</li>
        )}
      </ul>
    </div>
  );
}

export default function DoctorWallet() {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Stripe onboarding state
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [alreadyConnected, setAlreadyConnected] = useState<boolean>(false);
  const [checkingStripe, setCheckingStripe] = useState<boolean>(false);

  // Payout history
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const total = useMemo(
    () =>
      items.filter(i => i.paymentStatus === "success").reduce((s, i) => s + (i.doctorEarning || 0), 0),
    [items]
  );

  // Load payments
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await paymentService.listDoctorPayments();
        if (!active) return;
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
  }, [refreshKey]);

  // Check Stripe connection status
  useEffect(() => {
    setCheckingStripe(true);
    doctorService.startStripeOnboarding().then(result => {
      setStripeUrl(result.url);
      setAlreadyConnected(result.alreadyConnected);
      setCheckingStripe(false);
    }).catch(error => {
      setCheckingStripe(false);
    });
  }, []);

  // Load payout history
  useEffect(() => {
    (async () => {
      try {
        const out = await payoutService.listPayouts();
        setPayouts(Array.isArray(out) ? out : []);
      } catch {}
    })();
  }, [refreshKey]);

  function handlePayoutComplete() {
    setRefreshKey(k => k + 1); // reload both payments and payouts
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex h-screen">
        <DoctorSidebar isVerified={true} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-5">Wallet</h2>
            {err && (
              <div className="mb-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">
                {err}
              </div>
            )}

            {/* Balance Card */}
            <div className="mb-4 bg-white border rounded p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Current Balance (net)</div>
                <div className="text-2xl font-semibold">{formatINR(total)}</div>
              </div>
            </div>

            {/* Stripe Onboarding Section */}
           {/* Stripe Onboarding Section */}
<div className="mb-6 bg-white border rounded p-4">
  <h3 className="text-sm font-semibold mb-3">Payout Setup</h3>

  {checkingStripe ? (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span>Checking Stripe status...</span>
    </div>
  ) : !stripeUrl && !alreadyConnected ? (
    <div className="text-rose-700 text-sm py-2">
      Stripe onboarding info not available. Contact support or try refreshing the page.
    </div>
  ) : !alreadyConnected && stripeUrl ? (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        Connect your Stripe account to receive payouts directly to your bank account.
      </p>
      <a
        href={stripeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-medium"
      >
        Set up Stripe payouts
      </a>
      <div className="mt-2 text-xs text-gray-500">
        After completing Stripe onboarding, refresh the wallet to activate payouts.
      </div>
    </div>
  ) : alreadyConnected ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-2 bg-green-50 border border-green-700 text-green-700 px-3 py-2 rounded text-sm font-medium">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Stripe payouts connected! You can now withdraw your earnings.
      </span>
    </div>
  ) : null}
</div>

{/* Payout/Withdraw Section - Only show if Stripe is connected */}
{alreadyConnected && (
  <PayoutSection balance={total} onPayout={handlePayoutComplete} />
)}
{alreadyConnected && (
  <PayoutHistory records={payouts} />
)}

            
            {/* Payout/Withdraw Section - Only show if Stripe is connected */}
            {alreadyConnected && (
              <PayoutSection balance={total} onPayout={handlePayoutComplete} />
            )}
            {/* Payout History */}
            {alreadyConnected && (
              <PayoutHistory records={payouts} />
            )}

            {/* Recent Payments */}
            <div className="bg-white border rounded p-4">
              <div className="text-sm font-semibold mb-2">Recent Payments</div>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((it) => (
                    <li key={it._id} className="py-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">
                          {it.paymentStatus === "success"
                            ? "Booking earning"
                            : it.paymentStatus}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(it.createdAt).toLocaleString()} • Booking {it.bookingId}
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
