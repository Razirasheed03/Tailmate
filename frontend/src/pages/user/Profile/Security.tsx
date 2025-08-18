import { useNavigate } from "react-router-dom";

const Security = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Security</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 mb-3">
          Manage your password and security preferences.
        </p>
        <button
          onClick={() => navigate("/change-password")}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default Security;
