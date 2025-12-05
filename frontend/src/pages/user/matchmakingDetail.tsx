import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { useState } from "react";

export default function MatchmakingDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const listing = state?.listing;

  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-500">Listing not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 mb-3 hover:text-black"
        >
          ← Back
        </button>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Image */}
          <div className="relative h-72 bg-black flex items-center justify-center">
            {listing.photos?.length > 0 ? (
              <img
                src={listing.photos[currentImage]}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-lg">No Image</div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>

            <div className="text-gray-500 mb-4">
              📍 {listing.place}
            </div>

            <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {listing.description}
            </p>

            {/* Contact */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Contact Pet Owner</h2>

              <div
                className="cursor-pointer p-4 bg-gray-50 rounded-lg"
                onClick={() => setShowContact(!showContact)}
              >
                <span className="font-medium">
                  {showContact ? listing.contact : "Click to reveal contact"}
                </span>
              </div>

              {showContact && (
                <p className="text-blue-600 text-sm mt-2">
                  Make sure to speak politely and mention the listing title.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
