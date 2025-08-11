import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DoctorLandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Doctor Dashboard</h1>
      <div>
        <p className="mb-3 text-gray-700">Hello, {user?.username} (Doctor)</p>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={() => { logout(); navigate("/login"); }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DoctorLandingPage;
