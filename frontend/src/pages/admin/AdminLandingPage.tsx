import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
// import AdminNavbar from "../../components/UiComponents/AdminNavbar"
import { Outlet } from "react-router-dom";
const AdminLandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      {/* <AdminNavbar /> */}

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6">
        {/* Children routes will be rendered here */}
        <Outlet />
      </main>
    </div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div>
        <p className="mb-3 text-gray-700">Hello, {user?.username} (Admin)</p>
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
export default AdminLandingPage;
