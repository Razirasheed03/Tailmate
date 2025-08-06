import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");

  const logout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Temp LandingPage</h1>
      {!token ? (
        <div className="flex gap-4">
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-700"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate("/signup")}
          >
            Signup
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <span className="mb-3 text-gray-700">You are logged in.</span>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
