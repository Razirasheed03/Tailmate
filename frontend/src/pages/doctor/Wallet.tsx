import { useEffect, useState, useMemo } from "react";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { paymentService } from "@/services/paymentService";
// import { doctorService } from "@/services/doctorService";
// import { payoutService } from "@/services/payoutService";

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

// type PayoutRecord = {
//   _id: string;
//   amount: number;
//   createdAt: string;
//   status: "pending" | "paid" | "failed";
// };

// function PayoutSection({
//   balance,
//   onPayout,
// }: {
//   balance: number;
//   onPayout: () => void;
// }) {
//   const [amount, setAmount] = useState(Math.floor(balance));
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   async function handleWithdraw() {
//     setLoading(true);
//     setError(null);
//     setSuccess(null);
//     try {
//       await payoutService.requestPayout(amount);
//       setSuccess("Withdrawal initiated!");
//       setAmount(Math.floor(balance));
//       onPayout();
//     } catch (err: any) {
//       setError(err?.message || "Failed to withdraw");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="bg-white border rounded p-4 mb-6">
//       <h3 className="text-sm font-semibold mb-3">Withdraw Earnings</h3>
//       <div className="mb-2">
//         <input
//           type="number"
//           min={0}
//           max={balance}
//           value={amount}
//           onChange={(e) => setAmount(Number(e.target.value))}
//           className="border px-2 py-1 rounded w-32"
//         />
//       </div>
//       <button
//         className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
//         disabled={loading || amount < 1 || amount > balance}
//         onClick={handleWithdraw}
//       >
//         {loading ? "Processing..." : "Withdraw"}
//       </button>
//       {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
//       {success && (
//         <div className="mt-2 text-sm text-emerald-600">{success}</div>
//       )}
//     </div>
//   );
// }

// function PayoutHistory({ records }: { records: PayoutRecord[] }) {
//   return (
//     <div className="bg-white border rounded p-4 mb-6">
//       <div className="text-sm font-semibold mb-2">Payout History</div>
//       <ul className="divide-y">
//         {records.map((it) => (
//           <li key={it._id} className="py-3 flex items-center justify-between">
//             <span className="text-sm">
//               {new Date(it.createdAt).toLocaleString()}
//             </span>
//             <span className="font-medium">
//               {formatINR(it.amount)}{" "}
//               {it.status === "paid"
//                 ? "✅"
//                 : it.status === "failed"
//                 ? "❌"
//                 : "⏳"}
//             </span>
//           </li>
//         ))}
//         {records.length === 0 && (
//           <li className="py-6 text-sm text-gray-500 text-center">
//             No payout history yet
//           </li>
//         )}
//       </ul>
//     </div>
//   );
// }

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-2">
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : page === "..."
                ? "cursor-default text-gray-400"
                : "text-gray-700 bg-white border hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
      >
        Next
      </button>
    </div>
  );
}

export default function DoctorWallet() {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Stripe onboarding state
  // const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  // const [alreadyConnected, setAlreadyConnected] = useState<boolean>(false);
  // const [checkingStripe, setCheckingStripe] = useState<boolean>(false);
  // const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const total = useMemo(
    () =>
      items
        .filter((i) => i.paymentStatus === "success")
        .reduce((s, i) => s + (i.doctorEarning || 0), 0),
    [items]
  );

  // Load payments with pagination
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const result = await paymentService.listDoctorPayments({
          page: currentPage,
          limit: perPage,
          sortBy: "createdAt",
          order: "desc",
        });

        if (!active) return;

        setItems(result.data || []);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
        setHasNext(result.pagination.hasNext);
        setHasPrev(result.pagination.hasPrev);
      } catch (e: any) {
        if (!active) return;
        setErr(e?.message || "Failed to load payments");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentPage, perPage, refreshKey]);

  // // Check Stripe connection status
  // useEffect(() => {
  //   setCheckingStripe(true);
  //   doctorService
  //     .startStripeOnboarding()
  //     .then((result) => {
  //       setStripeUrl(result.url);
  //       setAlreadyConnected(result.alreadyConnected);
  //       setCheckingStripe(false);
  //     })
  //     .catch((error) => {
  //       setCheckingStripe(false);
  //     });
  // }, []);

  // // Load payout history
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const out = await payoutService.listPayouts();
  //       setPayouts(Array.isArray(out) ? out : []);
  //     } catch {}
  //   })();
  // }, [refreshKey]);

  // function handlePayoutComplete() {
  //   setRefreshKey((k) => k + 1); // reload both payments and payouts
  // }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex h-screen">
        <DoctorSidebar isVerified={true} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Wallet</h2>
            
            {err && (
              <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{err}</span>
              </div>
            )}

            {/* Balance Card */}
            <div className="mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-100 mb-1">Current Balance</div>
                  <div className="text-3xl font-bold tracking-tight">{formatINR(total)}</div>
                  <div className="text-xs text-blue-100 mt-2">Net earnings from completed bookings</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stripe Onboarding Section */}
            {/* <div className="mb-6 bg-white border rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Payout Setup</h3>

              {checkingStripe ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Checking Stripe status...</span>
                </div>
              ) : !stripeUrl && !alreadyConnected ? (
                <div className="text-rose-700 text-sm py-2">
                  Stripe onboarding info not available. Contact support or try
                  refreshing the page.
                </div>
              ) : !alreadyConnected && stripeUrl ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Connect your Stripe account to receive payouts directly to
                    your bank account.
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
                    After completing Stripe onboarding, refresh the wallet to
                    activate payouts.
                  </div>
                </div>
              ) : alreadyConnected ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 bg-green-50 border border-green-700 text-green-700 px-3 py-2 rounded text-sm font-medium">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Stripe payouts connected! You can now withdraw your
                    earnings.
                  </span>
                </div>
              ) : null}
            </div>
            {alreadyConnected && (
              <PayoutSection balance={total} onPayout={handlePayoutComplete} />
            )}
            {alreadyConnected && <PayoutHistory records={payouts} />}
            {alreadyConnected && (
              <PayoutSection balance={total} onPayout={handlePayoutComplete} />
            )}
  
            {alreadyConnected && <PayoutHistory records={payouts} />} */}

            {/* Payout Setup (Temporarily Disabled) */}
            <div className="mb-6 bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold mb-3 text-gray-900">Payout Setup</h3>
              <div className="flex items-start gap-3 text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-amber-800">
                  <div className="font-medium mb-1">Payouts are currently unavailable</div>
                  <div className="text-amber-700">
                    We are in the Stripe registration and verification process. Please check back later.
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Payment History</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {totalItems > 0 ? `Showing ${items.length} of ${totalItems} transactions` : 'No transactions yet'}
                  </p>
                </div>
                
                {/* Items per page selector */}
                {totalItems > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Show:</label>
                    <select
                      value={perPage}
                      onChange={(e) => handlePerPageChange(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-sm text-gray-500">Loading payments...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No payments yet</p>
                    <p className="text-sm text-gray-400 mt-1">Your payment history will appear here</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {items.map((it) => (
                        <div
                          key={it._id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`mt-1 p-2 rounded-full ${
                              it.paymentStatus === "success" 
                                ? "bg-emerald-100" 
                                : it.paymentStatus === "failed"
                                ? "bg-rose-100"
                                : "bg-amber-100"
                            }`}>
                              {it.paymentStatus === "success" ? (
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : it.paymentStatus === "failed" ? (
                                <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {it.paymentStatus === "success"
                                    ? "Booking Earnings"
                                    : it.paymentStatus === "failed"
                                    ? "Payment Failed"
                                    : "Payment Pending"}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  it.paymentStatus === "success"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : it.paymentStatus === "failed"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}>
                                  {it.paymentStatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{new Date(it.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                                <span>•</span>
                                <span className="font-mono text-xs">Booking #{it.bookingId.slice(-8)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-semibold ${
                              it.paymentStatus === "success" 
                                ? "text-emerald-600" 
                                : "text-gray-400"
                            }`}>
                              {it.paymentStatus === "success" ? "+" : ""}{formatINR(it.doctorEarning)}
                            </div>
                            {it.paymentStatus === "success" && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                of {formatINR(it.amount)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        hasNext={hasNext}
                        hasPrev={hasPrev}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}