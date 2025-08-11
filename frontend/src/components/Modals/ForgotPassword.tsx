import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:4000/api/auth/forgot-password", { email });
      toast.success("If the email exists, a reset link has been sent.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Forgot Password</h1>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your registered email"
        className="border p-2 rounded w-full"
      />
      <button type="submit" className="bg-orange-500 text-white py-2 px-4 rounded">
        Send Reset Link
      </button>
    </form>
  );
};

export default ForgotPassword;
