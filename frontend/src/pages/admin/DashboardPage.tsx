import  { useEffect, useState } from "react";
import { adminService } from "@/services/adminApiServices";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

type DashboardStats = {
  totalEarnings: number;
  totalUsers: number;
  totalDoctors: number;
  totalPets: number;
  totalBookings: number;
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalPets: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch {
        setStats({
          totalEarnings: 0,
          totalUsers: 0,
          totalDoctors: 0,
          totalPets: 0,
          totalBookings: 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { totalEarnings, totalUsers, totalDoctors, totalPets, totalBookings } = stats;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-100 rounded-2xl shadow p-6 flex flex-col justify-between min-h-[130px]">
          <div className="text-gray-600 text-sm mb-2 font-semibold">Platform Earnings</div>
          <div className="text-4xl font-bold text-green-700 tracking-wide mb-1">{formatINR(totalEarnings)}</div>
          <div className="text-xs text-gray-400">All-time revenue</div>
        </div>

        <div className="bg-gradient-to-tr from-blue-50 to-blue-100 border border-blue-100 rounded-2xl shadow p-6 flex flex-col justify-between min-h-[130px]">
          <div className="text-gray-600 text-sm mb-2 font-semibold">Total Users</div>
          <div className="text-4xl font-bold text-blue-700 tracking-wide mb-1">{totalUsers}</div>
          <div className="text-xs text-gray-400">Pet owners & patients</div>
        </div>

        <div className="bg-gradient-to-tr from-purple-50 to-purple-100 border border-purple-100 rounded-2xl shadow p-6 flex flex-col justify-between min-h-[130px]">
          <div className="text-gray-600 text-sm mb-2 font-semibold">Doctors</div>
          <div className="text-4xl font-bold text-purple-700 tracking-wide mb-1">{totalDoctors}</div>
          <div className="text-xs text-gray-400">Currently active</div>
        </div>

        <div className="bg-gradient-to-tr from-yellow-50 to-yellow-100 border border-yellow-100 rounded-2xl shadow p-6 flex flex-col justify-between min-h-[130px]">
          <div className="text-gray-600 text-sm mb-2 font-semibold">Pet Profiles</div>
          <div className="text-4xl font-bold text-yellow-700 tracking-wide mb-1">{totalPets}</div>
          <div className="text-xs text-gray-400">All-time registered</div>
        </div>

        <div className="bg-gradient-to-tr from-pink-50 to-pink-100 border border-pink-100 rounded-2xl shadow p-6 flex flex-col justify-between min-h-[130px]">
          <div className="text-gray-600 text-sm mb-2 font-semibold">Total Bookings</div>
          <div className="text-4xl font-bold text-pink-700 tracking-wide mb-1">{totalBookings}</div>
          <div className="text-xs text-gray-400">Complete + pending</div>
        </div>
      </div>
      {loading && <div className="w-full text-center text-gray-400 py-10">Loading dashboard...</div>}
    </section>
  );
};

export default DashboardPage;
