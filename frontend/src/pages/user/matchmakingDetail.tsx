import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function MatchmakingDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const listing = state?.listing;

  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnListing, setIsOwnListing] = useState(false);

  // ------------------------------  
  // CHECK IF USER OWNS THIS LISTING  
  // ------------------------------
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("auth_user");

      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        const isOwner =
          String(listing?.userId) === String(user._id || user.id);

        setIsOwnListing(isOwner);
      }
    } catch (err) {
      console.error("ownership check failed");
    }
  }, [listing]);

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

          <div className="p-6">
            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>

            {/* Place */}
            <div className="text-gray-500 mb-4">📍 {listing.place}</div>

            {/* Description */}
            <p className="text-gray-700 whitespace-pre-line mb-6 leading-relaxed">
              {listing.description}
            </p>

            {/* Contact Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">
                Contact Pet Owner
              </h2>

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
                  Speak politely and mention this listing.
                </p>
              )}
            </div>

            {/* ------------------------------  
                CHAT BUTTON (Not for owner)  
                ------------------------------ */}
            {!isOwnListing && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    // navigation placeholder – later you can implement real chat
                    navigate("/chat", {
                      state: {
                        sellerId: listing.userId,
                        listingId: listing._id,
                        listingTitle: listing.title,
                      }
                    });
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md"
                >
                  💬 Chat with Owner
                </button>
              </div>
            )}

            {/* If user is owner */}
            {isOwnListing && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 font-medium">
                  This is your matchmaking listing.
                </p>
                <p className="text-sm text-blue-600">
                  You cannot chat with yourself.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
