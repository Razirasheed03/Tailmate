import { Link, useLocation } from "react-router-dom";

const AdminNavbar = () => {
  const location = useLocation();

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-md font-medium ${
      location.pathname === path
        ? "bg-orange-500 text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
      <div className="flex gap-3">
        <Link to="/admin/users" className={navLinkClass("/admin/users")}>
          Users
        </Link>
        <Link to="/admin/doctors" className={navLinkClass("/admin/doctors")}>
          Doctors
        </Link>
      </div>
    </nav>
  );
};

export default AdminNavbar;
