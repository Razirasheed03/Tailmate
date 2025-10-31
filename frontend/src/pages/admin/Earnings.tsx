// src/pages/admin/Earnings.tsx
import { useEffect, useState } from "react";
import {adminService} from "@/services/adminApiServices";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const Earnings = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getWalletEarnings().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Admin Earnings</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Earnings by Doctor</h2>
        {loading ? (
          <div>Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-500 py-10 text-center">No earnings found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Doctor</th>
                <th className="text-left py-2">Email</th>
                <th className="text-right py-2">Consultations</th>
                <th className="text-right py-2">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row._id}>
                  <td className="py-1">{row.doctor?.username || row.doctor?.displayName || "Unknown Doctor"}</td>
                  <td className="py-1">{row.doctor?.email || "-"}</td>
                  <td className="text-right py-1">{row.count}</td>
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
