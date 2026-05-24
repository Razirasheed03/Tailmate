import { useState, useEffect } from "react";
import userService from "@/services/userService";

type WalletTransaction = {
  _id: string;
  kind?: "refund" | "marketplace_sale";
  amount: number;
  currency?: string;
  createdAt: string;
  bookingNumber?: string;
  listingId?: string;
  listingTitle?: string;
  paymentStatus?: string;
};

const Wallet = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalletData() {
      setLoading(true);
      setError(null);
      try {
        const walletRes = await userService.getWallet();
        if (walletRes.success) {
          setWallet(walletRes.data);
        }
        const txRes = await userService.getWalletTransactions();
        if (txRes.success && Array.isArray(txRes.data)) {
          setTransactions(txRes.data);
        } else {
          setTransactions([]);
        }
      } catch {
        setError("Failed to load wallet data");
      }
      setLoading(false);
    }
    fetchWalletData();
  }, []);

  function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  function txLabel(tx: WalletTransaction) {
    if (tx.kind === "marketplace_sale") {
      return tx.listingTitle || "Marketplace sale";
    }
    return tx.bookingNumber || "Booking refund";
  }

  function txStatus(tx: WalletTransaction) {
    if (tx.kind === "marketplace_sale") return "Sale credited";
    return "Refunded";
  }

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2">Wallet</h1>
      <p className="text-gray-600 mb-6">
        View your current balance and history of wallet activities
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-gray-500">Balance</span>
          <div className="text-2xl font-bold">
            {wallet
              ? `${wallet.currency || "INR"} ${(wallet.balanceMinor / 100).toFixed(2)}`
              : "--"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-3">Transaction History</h2>
        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-left py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-gray-500 text-center py-6">
                      No wallet credits yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                      <td className="py-3 px-2 text-sm">{txLabel(tx)}</td>
                      <td className="py-3 px-2 font-medium text-green-700">
                        + {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {txStatus(tx)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
