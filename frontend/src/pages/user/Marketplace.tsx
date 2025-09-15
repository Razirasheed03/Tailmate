// src/pages/user/Marketplace.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/UiComponents/UserNavbar';
import SellAdoptModal from '@/components/Modals/SellAdoptModal';
import { marketplaceService } from '@/services/marketplaceService';

interface Listing {
  _id: string;
  title: string;
  description: string;
  photos: string[];
  price: number | null;
  type: 'sell' | 'adopt';
  status: 'active' | 'reserved' | 'closed';
  ageText?: string;
  place: string;
  contact: string;
}

export default function Marketplace() {
  const [open, setOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchListings = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await marketplaceService.list({ page: pageNumber, limit: 12 });
      setListings(data.data as Listing[]);
      setPage(data.page || pageNumber);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(page);
  }, [page]);

  const refreshListings = () => {
    fetchListings(1);
    setPage(1);
  };

  const handleCardClick = (listing: Listing) => {
    navigate(`/marketplace/${listing._id}`, { state: { listing } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Marketplace</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading listings...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No listings found</p>
                <p className="text-gray-400 text-sm mt-2">Be the first to post a listing!</p>
              </div>
            ) : (
              listings.map((listing) => (
                <div
                  key={listing._id}
                  onClick={() => handleCardClick(listing)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {listing.price ? `₹${listing.price.toLocaleString()}` : 'Free'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      📍 {listing.place}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Create Listing"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 active:scale-95 transition flex items-center justify-center"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <SellAdoptModal
          open={open}
          onClose={() => setOpen(false)}
          onCreated={refreshListings}
        />
      )}
    </div>
  );
}
