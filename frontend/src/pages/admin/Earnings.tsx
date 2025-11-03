// src/pages/admin/Earnings.tsx
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminApiServices";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
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
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Admin Earnings</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Earnings by Doctor</h2>
        <div className="mb-6 text-lg font-semibold">
          Total Earnings: <span className="text-green-700">{formatINR(total)}</span>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : !Array.isArray(rows) || rows.length === 0 ? (
          <div className="text-gray-500 py-10 text-center">No earnings found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Doctor</th>
                <th className="text-left py-2">Email</th>
                <th className="text-right py-2">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.doctorId}>
                  <td className="py-1">{row.doctorName}</td>
                  <td className="py-1">{row.doctorEmail || "-"}</td>
                  <td className="text-right py-1 font-medium">
                    {formatINR(row.totalEarnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Earnings;
