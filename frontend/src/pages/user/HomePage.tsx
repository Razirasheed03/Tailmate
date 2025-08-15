import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold">Welcome, {user?.username} 👋</h1>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded mt-4"
        onClick={() => {
          logout();
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}
