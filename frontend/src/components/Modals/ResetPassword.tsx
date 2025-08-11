import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const id = searchParams.get("id");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:4000/api/auth/reset-password", {
        id,
        token,
        newPassword
      });
      toast.success("Password reset successfully. You can login now.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <form onSubmit={handleReset} className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Reset Password</h1>
      <input
        type="password"
        required
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        className="border p-2 rounded w-full"
      />
      <button type="submit" className="bg-orange-500 text-white py-2 px-4 rounded">
        Reset Password
      </button>
    </form>
  );
};

export default ResetPassword;
