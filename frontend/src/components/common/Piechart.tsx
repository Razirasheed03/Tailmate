import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusPieChart = ({ pending, completed, cancelled, failed, refunded }: any) => {
  const data = {
    labels: ["Pending", "Completed", "Cancelled", "Failed", "Refunded"],
    datasets: [
      {
        data: [pending, completed, cancelled, failed, refunded],
        backgroundColor: [
          "#facc15", // Pending
          "#22c55e", // Completed
          "#ef4444", // Cancelled
          "#64748b", // Failed
          "#0af4ec", // Refunded
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="h-56">
      <Doughnut data={data} />
    </div>
  );
};

export default StatusPieChart;
