import { useNavigate } from "react-router-dom";

const PetProfiles = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Pet Profiles</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 mb-3">
          View and manage your pet profiles.
        </p>
        <button
          onClick={() => navigate("/pets")}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
        >
          Go to Pet Profiles
        </button>
      </div>
    </div>
  );
};

export default PetProfiles;
