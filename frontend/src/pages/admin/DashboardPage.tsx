import { useEffect, useState } from "react";
import { adminService } from "@/services/adminApiServices";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR",
    maximumFractionDigits: 0 
  }).format(amount);
}

type DashboardStats = {
  totalEarnings: number;
  totalUsers: number;
  totalDoctors: number;
  totalPets: number;
  totalBookings: number;
  months?: string[];
  incomeByMonth?: number[];
};

const IncomeLineChart = ({ months, income }: { months: string[]; income: number[] }) => {
  const data = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Income',
        data: income,
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234, 88, 12, 0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `Revenue: ${formatINR(ctx.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false
        },
        grid: {
          color: '#f1f5f9',
          drawTicks: false,
        },
        ticks: {
          padding: 8,
          color: '#64748b',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return '₹' + (value / 1000) + 'k';
          }
        }
      },
      x: {
        border: {
          display: false
        },
        grid: {
          display: false,
        },
        ticks: {
          padding: 8,
          color: '#64748b',
          font: {
            size: 11,
          }
        }
      }
    }
  } as const;

  return (
    <div className="h-48 sm:h-56">
      <Line data={data} options={options} />
    </div>
  );
};

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon 
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
    <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1 tracking-tight">{value}</div>
    <div className="text-xs text-slate-500">{subtitle}</div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalPets: 0,
    totalBookings: 0,
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    incomeByMonth: [1200, 1450, 1370, 1600, 2000, 2270],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashboardData, incomeData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getIncomeByMonth()
        ]);
        
        setStats((prev) => ({
          ...prev,
          ...dashboardData,
          months: incomeData?.months || prev.months,
          incomeByMonth: incomeData?.incomeByMonth || prev.incomeByMonth,
        }));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { totalEarnings, totalUsers, totalDoctors, totalPets, totalBookings, months, incomeByMonth } = stats;

  if (loading) {
    return (
      <section className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin"></div>
          <div className="text-slate-600 text-sm font-medium">Loading dashboard...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full h-screen overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <StatCard
            title="Platform Revenue"
            value={formatINR(totalEarnings)}
            subtitle="Total earnings to date"
            icon="💰"
          />
          
          <StatCard
            title="Total Users"
            value={totalUsers.toLocaleString()}
            subtitle="Registered pet owners"
            icon="👥"
          />
          
          <StatCard
            title="Active Doctors"
            value={totalDoctors.toLocaleString()}
            subtitle="Verified veterinarians"
            icon="⚕️"
          />
          
          <StatCard
            title="Pet Profiles"
            value={totalPets.toLocaleString()}
            subtitle="Registered pets"
            icon="🐾"
          />
          
          <StatCard
            title="Total Bookings"
            value={totalBookings.toLocaleString()}
            subtitle="All appointments"
            icon="📅"
          />

          {/* Chart Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 sm:col-span-2 lg:col-span-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-orange-600 mb-1">Revenue Overview</h2>
                <p className="text-xs text-slate-500">Monthly income trend</p>
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded-lg self-start">
                <span className="text-xs font-medium text-slate-700">Last 6 Months</span>
              </div>
            </div>
            
            {!!months && !!incomeByMonth ? (
              <IncomeLineChart months={months} income={incomeByMonth} />
            ) : (
              <div className="h-48 sm:h-56 flex items-center justify-center text-slate-400 text-sm">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;