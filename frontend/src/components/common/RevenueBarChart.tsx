import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const RevenueBarChart = ({ months, income }: { months: string[]; income: number[] }) => {
  const data = {
    labels: months,
    datasets: [
      {
        label: "Monthly Revenue",
        data: income,
        backgroundColor: "rgba(234, 88, 12, 0.7)", // orange
        borderRadius: 6,
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
        titleColor: "#f1f5f9",
        bodyColor: "#f1f5f9",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#64748b" },
        grid: { color: "#e2e8f0" },
      },
      x: {
        ticks: { color: "#64748b" },
        grid: { display: false },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default RevenueBarChart;
