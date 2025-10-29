// src/pages/user/ListingDetail.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/UiComponents/UserNavbar';
import httpClient from '@/services/httpClient';
import { toast } from 'sonner';

interface Listing {
  _id: string;
  title: string;
  description: string;
  photos: string[];
  price: number | null;
  type: 'sell' | 'adopt';
  ageText?: string;
  place: string;
  contact: string;
  userId?: string; // seller's user ID
}

export default function ListingDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const listing = location.state?.listing as Listing;
  
  const [showContact, setShowContact] = useState(false); 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnListing, setIsOwnListing] = useState(false);

  // Check ownership using localStorage (no API call needed)
  useEffect(() => {
    const checkOwnership = () => {
      try {
        // Get user from localStorage (stored during login)
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedUser && listing) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          
          // Check if current user is the listing owner
          const isOwner = String(listing.userId) === String(user._id || user.id);
          setIsOwnListing(isOwner);
        }
      } catch (error) {
        console.error('Failed to check ownership:', error);
        // Silently fail - user can still view listing
      }
    };

    checkOwnership();
  }, [listing]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Listing not found</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing.photos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + listing.photos.length) % listing.photos.length);
  };

  const handleBuyNow = async () => {
    try {
      const res = await httpClient.post('/marketplace-payments/create-checkout-session', { 
        listingId: listing._id 
      });
      const url = res?.data?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error?.response?.data?.message || 'Failed to initiate purchase');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Back Button */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          
          {/* Modern Image Gallery */}
          <div className="relative group">
            <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
              {listing.photos && listing.photos.length > 0 ? (
                <>
                  <img
                    src={listing.photos[currentImageIndex]}
                    alt={`${listing.title} - ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain bg-black"
                  />
                  
                  {/* Navigation Arrows */}
                  {listing.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        ←
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        →
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {listing.photos.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {listing.photos.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {listing.photos && listing.photos.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {listing.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-orange-500' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Type Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                listing.type === 'sell' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {listing.type === 'sell' ? 'For Sale' : 'For Adoption'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            </div>
            
            <div className="text-3xl font-bold text-green-600 mb-6">
              {listing.price ? `₹${listing.price.toLocaleString()}` : 'Free'}
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span>📍</span>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{listing.place}</p>
                </div>
              </div>
              
              {listing.ageText && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span>📅</span>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{listing.ageText}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Buy Now Button - Hidden for Own Listings */}
            {isOwnListing ? (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="font-medium text-blue-900">This is your listing</p>
                    <p className="text-sm text-blue-700">You cannot purchase your own listing. Manage it from your dashboard.</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleBuyNow}
                className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
              >
                Buy Now
              </button>
            )}

            {/* Contact Section */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Contact Seller</h2>
              
              <div 
                className="inline-flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setShowContact(!showContact)}
              >
                <span className="text-xl">📞</span>
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {showContact ? 'Contact Number' : 'Click to reveal contact'}
                  </p>
                  <p className={`font-medium text-lg ${showContact ? 'text-gray-900' : 'blur-sm text-gray-700'}`}>
                    {listing.contact}
                  </p>
                </div>
                {!showContact && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                )}
              </div>

              {showContact && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Contact the seller during reasonable hours. Be polite and mention this listing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}