import { useState, useEffect } from "react";
import userService from "@/services/userService";

const Wallet = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWalletData() {
      setLoading(true);
      try {
        const walletRes = await userService.getWallet();
        setWallet(walletRes.data);

        const txRes = await userService.getWalletTransactions();
        setTransactions(txRes.data || []);
      } catch (err) {}
      setLoading(false);
    }
    fetchWalletData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2">Wallet</h1>
      <p className="text-gray-600 mb-6">View your current balance and history of wallet activities</p>

      {/* Balance Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-gray-500">Balance</span>
          <div className="text-2xl font-bold">
            {wallet ? `${wallet.currency || "INR"} ${(wallet.balanceMinor/100).toFixed(2)}` : "--"}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-3">Transaction History</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-gray-500 text-center py-6">No transactions yet</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id}>
                    <td className="py-1">{(new Date(tx.createdAt)).toLocaleString()}</td>
                    <td className="py-1">{tx.type}</td>
                    <td className={`py-1 font-medium ${tx.amount > 0 ? "text-green-700" : "text-red-700"}`}>
                      {(tx.amount/100).toFixed(2)}
                    </td>
                    <td className="py-1">{tx.note || ""}</td>
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

export default Wallet;
