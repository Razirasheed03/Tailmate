// ------------------------------
// DashboardPage.tsx (FULL DROP-IN)
// ------------------------------

import { useEffect, useState } from "react";
import { adminService } from "@/services/adminApiServices";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import StatusPieChart from "@/components/common/Piechart";
import RevenueBarChart from "@/components/common/RevenueBarChart";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

// Format INR
function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type DashboardStats = {
  totalEarnings: number;
  totalUsers: number;
  totalDoctors: number;
  totalPets: number;
  totalBookings: number;
  months: string[];
  incomeByMonth: number[];
};

// ------------------------------
// Line Chart Component
// ------------------------------
const IncomeLineChart = ({
  months,
  income,
}: {
  months: string[];
  income: number[];
}) => {
  const data = {
    labels: months,
    datasets: [
      {
        label: "Monthly Income",
        data: income,
        borderColor: "#ea580c",
        backgroundColor: "rgba(234, 88, 12, 0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#ea580c",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        titleColor: "#f1f5f9",
        bodyColor: "#f1f5f9",
        borderColor: "#334155",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `Revenue: ${formatINR(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#64748b",
          callback: (value: any) => "₹" + value / 1000 + "k",
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" },
      },
    },
  };

  return (
    <div className="h-48 sm:h-56">
      <Line data={data} options={options} />
    </div>
  );
};

// ------------------------------
// Stat Card Component
// ------------------------------
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className="text-slate-600 text-sm font-medium">{title}</div>
      <div className="text-xl">{icon}</div>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1 tracking-tight">
      {value}
    </div>
    <div className="text-xs text-slate-500">{subtitle}</div>
  </div>
);

// ------------------------------
// Dashboard Page Component
// ------------------------------
const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalPets: 0,
    totalBookings: 0,
    months: [],
    incomeByMonth: [],
  });

  const [statusChart, setStatusChart] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
    refunded: 0,
  });

  const [loading, setLoading] = useState(true);

  // --------------------------
  // Advanced Earnings Filter
  // --------------------------
  const [filter, setFilter] = useState({
    start: "",
    end: "",
    doctorId: "",
  });

  const [filteredEarnings, setFilteredEarnings] = useState({
    totalRevenue: 0,
    totalPlatformFee: 0,
    totalDoctorEarnings: 0,
    count: 0,
  });

  const [doctorList, setDoctorList] = useState<any[]>([]);

  const fetchFilteredEarnings = async () => {
    try {
      const data = await adminService.getFilteredEarnings(
        filter.start,
        filter.end,
        filter.doctorId
      );
      setFilteredEarnings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch doctors for dropdown
  useEffect(() => {
    (async () => {
      try {
        const result = await adminService.getDoctorList(); // <-- required
        setDoctorList(result);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    })();
  }, []);

  // Fetch dashboard + income
  useEffect(() => {
    (async () => {
      try {
        const [dashboardData, incomeData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getIncomeByMonth(),
        ]);

        setStats({
          ...dashboardData,
          months: incomeData?.months || [],
          incomeByMonth: incomeData?.income || [],
        });
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch status chart
  useEffect(() => {
    (async () => {
      try {
        const chart = await adminService.getStatusChart();

        setStatusChart({
          pending: chart.pending,
          completed: chart.completed,
          cancelled: chart.cancelled,
          failed: chart.failed,
          refunded: chart.refunded,
        });
      } catch (err) {
        console.error("Failed to fetch status chart:", err);
      }
    })();
  }, []);

  // --------------------------
  // Loading screen
  // --------------------------
  if (loading) {
    return (
      <section className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin"></div>
          <div className="text-slate-600 text-sm font-medium">
            Loading dashboard...
          </div>
        </div>
      </section>
    );
  }

  // --------------------------
  // Render
  // --------------------------
  return (
    <section className="w-full h-screen overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">

        {/* ------------------------------ */}
        {/* Advanced Earnings Filter */}
        {/* ------------------------------ */}
        <div className="bg-white border rounded-xl p-5 mb-5">
          <h2 className="text-lg font-semibold mb-4 text-orange-600">
            Advanced Earnings Filter
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <input
              type="date"
              className="border rounded p-2"
              value={filter.start}
              onChange={(e) => setFilter({ ...filter, start: e.target.value })}
            />

            <input
              type="date"
              className="border rounded p-2"
              value={filter.end}
              onChange={(e) => setFilter({ ...filter, end: e.target.value })}
            />

            <select
              className="border rounded p-2"
              value={filter.doctorId}
              onChange={(e) =>
                setFilter({ ...filter, doctorId: e.target.value })
              }
            >
              <option value="">All Doctors</option>
              {doctorList.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.username}
                </option>
              ))}
            </select>

          </div>

          <button
            className="mt-4 bg-orange-600 text-white px-4 py-2 rounded"
            onClick={fetchFilteredEarnings}
          >
            Apply Filter
          </button>

          {/* Filtered Results */}
          <div className="mt-4 text-sm">
            <p>Total Revenue: ₹{filteredEarnings.totalRevenue}</p>
            <p>Platform Fee: ₹{filteredEarnings.totalPlatformFee}</p>
            <p>Doctor Earnings: ₹{filteredEarnings.totalDoctorEarnings}</p>
            <p>Filtered Bookings: {filteredEarnings.count}</p>
          </div>
        </div>

        {/* ------------------------------ */}
        {/* Dashboard Stats */}
        {/* ------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

          <StatCard title="Platform Revenue" value={formatINR(stats.totalEarnings)} subtitle="Total earnings to date" icon="💰" />
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} subtitle="Registered pet owners" icon="👥" />
          <StatCard title="Active Doctors" value={stats.totalDoctors.toLocaleString()} subtitle="Verified veterinarians" icon="⚕️" />
          <StatCard title="Pet Profiles" value={stats.totalPets.toLocaleString()} subtitle="Registered pets" icon="🐾" />
          <StatCard title="Total Bookings" value={stats.totalBookings.toLocaleString()} subtitle="All appointments" icon="📅" />

          {/* Income Line Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 sm:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold text-orange-600 mb-1">
              Revenue Overview
            </h2>

            {stats.months.length ? (
              <IncomeLineChart months={stats.months} income={stats.incomeByMonth} />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">No data available</div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-3">Booking Status Overview</h2>

            <StatusPieChart
              pending={statusChart.pending}
              completed={statusChart.completed}
              cancelled={statusChart.cancelled}
              failed={statusChart.failed}
              refunded={statusChart.refunded}
            />
          </div>

          {/* Monthly Revenue Bar Chart */}
          <div className="bg-white border rounded-xl p-5 sm:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-3 text-orange-600">
              Monthly Revenue (Bar Graph)
            </h2>

            {stats.months.length ? (
              <div className="h-64">
                <RevenueBarChart months={stats.months} income={stats.incomeByMonth} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No revenue data available
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
