import { Pie } from "react-chartjs-2";

export default function DoctorStatusPie({ pending, completed, cancelled }:any) {
  const data = {
    labels: ["Pending", "Completed", "Cancelled"],
    datasets: [
      {
        data: [pending, completed, cancelled],
        backgroundColor: ["#fbbf24", "#22c55e", "#ef4444"],
      },
    ],
  };

  return <Pie data={data} />;
}
