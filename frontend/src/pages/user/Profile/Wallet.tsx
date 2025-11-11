import { useState, useEffect } from "react";
import userService from "@/services/userService";

const Wallet = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
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
      } catch (err) {
        setError('Failed to load wallet data');
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

  function generateBookingNumber(id: string | undefined, prefix: string = "BKD"): string {
    if (!id || id.length < 6) return prefix + "0000";
    return `${prefix}${id.slice(-6).toUpperCase()}`;
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

      {/* Balance Section */}
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

      {/* Transaction History */}
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
                  <th className="text-left py-2 px-2">Booking No.</th>
                  <th className="text-left py-2 px-2">Refunded Amount</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-gray-500 text-center py-6">
                      No wallet credits/refunds yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-2 font-mono text-sm">
                        {generateBookingNumber(tx.bookingId?.toString(), "BKD")}
                      </td>
                      <td className="py-3 px-2 font-medium text-green-700">
                        {/* FIX: NO / 100! */}
                        + {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Refunded
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
