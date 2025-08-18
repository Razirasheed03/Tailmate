import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";

const Personal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Username</label>
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-gray-900">{user?.username || "-"}</span>
            <button
              onClick={() => navigate(`${APP_ROUTES.PROFILE}/edit-username`)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Edit
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-gray-900">{user?.email || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personal;
