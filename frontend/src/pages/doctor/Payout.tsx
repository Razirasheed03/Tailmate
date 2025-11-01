// src/pages/Payout.tsx

import { useState, useEffect } from "react";
import payoutService from "@/services/payoutService";

type OwnerType = "user" | "doctor";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const Payout = ({ ownerType = "user" }: { ownerType?: OwnerType }) => {
  const [amount, setAmount] = useState("");
  const [currency] = useState("INR");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch payout history on mount and after requests
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await payoutService.getMyPayoutHistory(ownerType);
      setHistory(data);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load payout history");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [ownerType]);

  const handleRequest = async () => {
    if (!amount) return;
    setLoading(true);
    setMessage(null);
    try {
      await payoutService.requestPayout(ownerType, parseFloat(amount), currency);
      setMessage("Payout requested successfully!");
      setAmount("");
      fetchHistory();
    } catch (e: any) {
      setMessage(e?.message || "Failed to request payout");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="font-bold text-2xl mb-4">Request Payout</h1>
      <div className="bg-white rounded shadow p-4 mb-4 flex items-center gap-3">
        <input
          type="number"
          value={amount}
          min={0}
          placeholder="Amount"
          onChange={e => setAmount(e.target.value)}
          className="border px-3 py-2 rounded flex-1"
        />
        <button
          onClick={handleRequest}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className={`bg-blue-600 text-white px-4 py-2 rounded ${loading ? "opacity-50" : ""}`}
        >
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </div>
      {message && (
        <div className={`mb-4 p-2 rounded text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>
          {message}
        </div>
      )}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-3">Payout History</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">No payouts yet</td>
                </tr>
              ) : (
                history.map(row => (
                  <tr key={row._id}>
                    <td>{row.requestedAt ? (new Date(row.requestedAt)).toLocaleString() : ""}</td>
                    <td>{formatINR(row.amountMinor / 100)}</td>
                    <td>{row.status}</td>
                    <td>{row.failureReason || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Payout;
