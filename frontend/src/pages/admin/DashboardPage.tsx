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

// INR Formatter
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);

type DashboardStats = {
  totalEarnings: number;
  totalUsers: number;
  totalDoctors: number;
  totalPets: number;
  totalBookings: number;
  months: string[];
  incomeByMonth: number[];
};

type GrowthStats = {
  users: { current: number; previous: number; percent: number };
  doctors: { current: number; previous: number; percent: number };
  bookings: { current: number; previous: number; percent: number };
};

const formatGrowth = (p?: number) => {
  if (p === undefined || p === null) return "No change";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}% from last month`;
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// ------------------------------------------------------------------
// RE-USABLE STAT CARD
// ------------------------------------------------------------------
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
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex justify-between items-center mb-3">
      <h4 className="text-sm text-slate-600 font-medium">{title}</h4>
      <span className="text-2xl">{icon}</span>
    </div>
    <div className="text-3xl font-semibold text-orange-600">{value}</div>
    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
  </div>
);

// ------------------------------------------------------------------
// LINE CHART (Modern + Clean)
// ------------------------------------------------------------------
const IncomeLineChart = ({ months, income }: { months: string[]; income: number[] }) => {
  const data = {
    labels: months,
    datasets: [
      {
        label: "Monthly Revenue",
        data: income,
        borderColor: "#ea580c",
        backgroundColor: "rgba(234, 88, 12, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#ea580c",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Revenue: ${formatINR(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v: any) => `₹${v / 1000}k`,
        },
        grid: { color: "#f1f5f9" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return <Line data={data} options={options} />;
};

// ------------------------------------------------------------------
// MAIN PAGE
// ------------------------------------------------------------------
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
  const [growth, setGrowth] = useState<GrowthStats | null>(null);
  const [doctorList, setDoctorList] = useState<any[]>([]);

  const [filter, setFilter] = useState({
    start: "",
    end: "",
    doctorId: "",
  });

  const [dateError, setDateError] = useState("");

  const [filteredEarnings, setFilteredEarnings] = useState({
    totalRevenue: 0,
    totalPlatformFee: 0,
    totalDoctorEarnings: 0,
    count: 0,
  });

  // Validate date range
  const validateDateRange = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return "";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return "End date cannot be before start date";
    }
    
    return "";
  };

  const handleStartDateChange = (value: string) => {
    setFilter({ ...filter, start: value });
    const error = validateDateRange(value, filter.end);
    setDateError(error);
  };

  const handleEndDateChange = (value: string) => {
    setFilter({ ...filter, end: value });
    const error = validateDateRange(filter.start, value);
    setDateError(error);
  };

  const fetchFilteredEarnings = async () => {
    // Final validation before fetching
    if (dateError) {
      return;
    }

    try {
      const data = await adminService.getFilteredEarnings(
        filter.start,
        filter.end,
        filter.doctorId
      );
      setFilteredEarnings(data);
    } catch (e) {
      console.error(e);
    }
  };

  // FETCH DOCTORS
  useEffect(() => {
    adminService
      .getDoctorList()
      .then((res) => setDoctorList(res))
      .catch((e) => console.error(e));
  }, []);

  // FETCH ALL DASHBOARD DATA
  useEffect(() => {
    (async () => {
      try {
        const [dashboard, income, growthStats, status] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getIncomeByMonth(),
          adminService.getGrowthStats(),
          adminService.getStatusChart(),
        ]);

        setStats({
          ...dashboard,
          months: income?.months || [],
          incomeByMonth: income?.income || [],
        });

        setGrowth(growthStats);
        setStatusChart(status);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const todayDate = getTodayDate();

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ---------------------- EARNINGS FILTER ---------------------- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-orange-600">Filter Earnings</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                className="border rounded-md p-2 text-sm w-full"
                value={filter.start}
                max={todayDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                className="border rounded-md p-2 text-sm w-full"
                value={filter.end}
                min={filter.start || undefined}
                max={todayDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-600 mb-1">Doctor</label>
              <select
                className="border rounded-md p-2 text-sm w-full"
                value={filter.doctorId}
                onChange={(e) => setFilter({ ...filter, doctorId: e.target.value })}
              >
                <option value="">All Doctors</option>
                {doctorList.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dateError && (
            <p className="mt-2 text-sm text-red-600">⚠️ {dateError}</p>
          )}

          <button
            className={`mt-4 px-5 py-2 rounded-md text-sm transition-colors ${
              dateError
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-orange-600 text-white hover:bg-orange-700"
            }`}
            onClick={fetchFilteredEarnings}
            disabled={!!dateError}
          >
            Apply Filter
          </button>

          <div className="mt-4 text-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
            <p className="text-slate-600">
              <span className="font-medium">Total Revenue:</span> ₹{filteredEarnings.totalRevenue.toLocaleString()}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Platform Fee:</span> ₹{filteredEarnings.totalPlatformFee.toLocaleString()}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Doctor Earnings:</span> ₹{filteredEarnings.totalDoctorEarnings.toLocaleString()}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Bookings:</span> {filteredEarnings.count}
            </p>
          </div>
        </div>

        {/* ---------------------- STAT CARDS --------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Platform Revenue"
            value={formatINR(stats.totalEarnings)}
            subtitle={growth ? formatGrowth(growth.bookings.percent) : ""}
            icon="💰"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            subtitle={growth ? formatGrowth(growth.users.percent) : ""}
            icon="👥"
          />
          <StatCard
            title="Active Doctors"
            value={stats.totalDoctors.toLocaleString()}
            subtitle={growth ? formatGrowth(growth.doctors.percent) : ""}
            icon="⚕️"
          />
          <StatCard
            title="Pet Profiles"
            value={stats.totalPets.toLocaleString()}
            subtitle="Registered pets"
            icon="🐾"
          />
        </div>

        {/* -------------------- CHARTS SECTION ------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue Line Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold text-orange-600 mb-3">Revenue Trend</h3>
            <div className="h-64">
              {stats.months.length ? (
                <IncomeLineChart months={stats.months} income={stats.incomeByMonth} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Booking Status</h3>
            <StatusPieChart {...statusChart} />
          </div>
        </div>

        {/* -------------------- BAR CHART ------------------------------ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-orange-600 mb-3">
            Monthly Revenue Breakdown
          </h3>
          <div className="h-72">
            {stats.months.length ? (
              <RevenueBarChart months={stats.months} income={stats.incomeByMonth} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                No revenue data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;