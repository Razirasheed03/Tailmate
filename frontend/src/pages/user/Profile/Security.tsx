// src/pages/profile/Security.tsx
import { useState } from "react";
import { toast } from "sonner";
import userService from "@/services/userService";

const Security = () => {

  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*\-]).{8,}$/;


const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!currentPassword || !newPassword) {
    return toast.error("All fields are required");
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return toast.error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    );
  }

  if (currentPassword === newPassword) {
    return toast.error("New password must be different from current password");
  }

  try {
    setLoading(true);

    await userService.changePassword({
      currentPassword,
      newPassword,
    });

    // explicit logout
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    toast.success("Password changed successfully. Please login again.");

    window.location.href = "/login";
  } catch (err: any) {
    toast.error(err?.message || "Failed to change password");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Security</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 mb-3">
          Manage your password and security preferences.
        </p>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
          >
            Change Password
          </button>
        )}

        {showForm && (
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Security;
