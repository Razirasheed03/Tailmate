import { useEffect, useState } from "react";
import { adminService } from "@/services/adminApiServices";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function DoctorAvatar({ name }: { name?: string }) {
  if (!name) return <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg">?</div>;
  const initials = name.split(' ').map(part => part[0]?.toUpperCase()).join('').slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
      {initials}
    </div>
  );
}

const Earnings = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    adminService
      .getWalletEarnings()
      .then((result) => {
        if (result && Array.isArray(result.earnings)) {
          setRows(result.earnings);
          setTotal(result.totalEarnings ?? 0);
        } else if (Array.isArray(result)) {
          setRows(result);
          setTotal(result.reduce((sum, r) => sum + (r.totalEarnings ?? 0), 0));
        } else {
          setRows([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8">Admin Earnings</h1>
      {/* Earnings summary card */}
      <div className="bg-gradient-to-r from-green-50 to-white border border-green-100 rounded-2xl shadow flex items-center gap-6 p-6 mb-7">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Total Platform Earnings</h2>
          <div className="text-3xl font-bold text-green-700 tracking-wide">{formatINR(total)}</div>
        </div>
        <div>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="22" fill="#E6F4EA"/><path d="M32 26c0 2.209-1.791 4-4 4H16c-2.209 0-4-1.791-4-4" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/><circle cx="18.5" cy="17.5" r="2.5" fill="#10B981"/><circle cx="25.5" cy="17.5" r="2.5" fill="#10B981"/></svg>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">By Doctor</h3>
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading earnings...</div>
        ) : !Array.isArray(rows) || rows.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-lg">No earnings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="text-left pl-6 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Doctor</th>
                  <th className="text-left py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="text-right pr-6 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">Total Earnings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.doctorId} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="flex items-center gap-3 pl-6 py-2">
                      <DoctorAvatar name={row.doctorName} />
                      <span className="font-semibold text-gray-800">{row.doctorName}</span>
                    </td>
                    <td className="py-2">{row.doctorEmail || <span className="text-gray-400">—</span>}</td>
                    <td className="pr-6 py-2 text-right font-bold text-green-700">{formatINR(row.totalEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
