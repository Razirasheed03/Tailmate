// src/pages/user/Marketplace.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/UiComponents/UserNavbar';
import SellAdoptModal from '@/components/Modals/SellAdoptModal';
import { marketplaceService } from '@/services/marketplaceService';
import { ListingMapper } from '@/mappers/listingMapper';
import type { DomainListing, UIListing } from '@/types/api.types';

interface SearchFilters {
  q: string;
  place: string;
  type: 'all' | 'sell' | 'adopt';
  minPrice: string;
  maxPrice: string;
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'title_az' | 'title_za';
  includeFree: boolean;
}

export default function Marketplace() {
  const [open, setOpen] = useState(false);
  const [domainListings, setDomainListings] = useState<DomainListing[]>([]);
  const [uiListings, setUIListings] = useState<UIListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const navigate = useNavigate();

  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || '',
    place: searchParams.get('place') || '',
    type: (searchParams.get('type') as 'all' | 'sell' | 'adopt') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: (searchParams.get('sortBy') as any) || 'newest',
    includeFree: searchParams.get('includeFree') !== 'false'
  });

  // Temporary filters for modal (only applied when "Apply" is clicked)
  const [tempFilters, setTempFilters] = useState<SearchFilters>(filters);


  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'title_az', label: 'Title: A to Z' },
    { value: 'title_za', label: 'Title: Z to A' }
  ];

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchListings = useCallback(async (pageNumber = 1, searchFilters = filters) => {
    try {
      setLoading(true);
      
      const params: any = {
        page: pageNumber,
        limit: 12
      };

      // Add search parameters
      if (searchFilters.q.trim()) params.q = searchFilters.q.trim();
      if (searchFilters.place.trim()) params.place = searchFilters.place.trim();
      if (searchFilters.type !== 'all') params.type = searchFilters.type;
      if (searchFilters.minPrice.trim()) params.minPrice = parseInt(searchFilters.minPrice);
      if (searchFilters.maxPrice.trim()) params.maxPrice = parseInt(searchFilters.maxPrice);
      if (!searchFilters.includeFree) params.excludeFree = true;
      if (searchFilters.sortBy) params.sortBy = searchFilters.sortBy;

      // Service now returns domain models
      const paginatedData = await marketplaceService.list(params);
      
      // Store domain models
      setDomainListings(paginatedData.data);
      
      // Convert domain models to UI models for display
      const uiListingsData = ListingMapper.domainArrayToUIArray(paginatedData.data);
      setUIListings(uiListingsData);
      
      setPage(paginatedData.page || pageNumber);
      setTotalPages(paginatedData.totalPages || 1);
      setTotal(paginatedData.total || 0);

      // Update URL parameters
      const newSearchParams = new URLSearchParams();
      if (searchFilters.q.trim()) newSearchParams.set('q', searchFilters.q.trim());
      if (searchFilters.place.trim()) newSearchParams.set('place', searchFilters.place.trim());
      if (searchFilters.type !== 'all') newSearchParams.set('type', searchFilters.type);
      if (searchFilters.minPrice.trim()) newSearchParams.set('minPrice', searchFilters.minPrice.trim());
      if (searchFilters.maxPrice.trim()) newSearchParams.set('maxPrice', searchFilters.maxPrice.trim());
      if (searchFilters.sortBy !== 'newest') newSearchParams.set('sortBy', searchFilters.sortBy);
      if (!searchFilters.includeFree) newSearchParams.set('includeFree', 'false');
      if (pageNumber > 1) newSearchParams.set('page', pageNumber.toString());
      
      setSearchParams(newSearchParams);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setDomainListings([]);
      setUIListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, setSearchParams]);

  // Handle search with debouncing (only for search input)
  const handleSearchInput = useCallback((searchQuery: string) => {
    const newFilters = { ...filters, q: searchQuery };
    setFilters(newFilters);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setPage(1);
      fetchListings(1, newFilters);
    }, 500);

    setSearchTimeout(timeout);
  }, [searchTimeout, filters, fetchListings]);

  useEffect(() => {
    const initialPage = parseInt(searchParams.get('page') || '1');
    setPage(initialPage);
    fetchListings(initialPage);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const refreshListings = () => {
    fetchListings(1, filters);
    setPage(1);
  };

  const handleCardClick = (uiListing: UIListing) => {
    // Find the corresponding domain listing for navigation
    const domainListing = domainListings.find(dl => dl.id === uiListing.id);
    navigate(`/marketplace/${uiListing.id}`, { state: { listing: domainListing } });
  };

  const clearFilters = () => {
    const resetFilters: SearchFilters = {
      q: '',
      place: '',
      type: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      includeFree: true
    };
    setFilters(resetFilters);
    setTempFilters(resetFilters);
    setPage(1);
    fetchListings(1, resetFilters);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchListings(newPage, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const resetTempFilters = () => {
    setTempFilters(filters);
  };

  const hasActiveFilters = filters.q || filters.place || filters.type !== 'all' || 
                          filters.minPrice || filters.maxPrice || !filters.includeFree || 
                          filters.sortBy !== 'newest';

  const activeFilterCount = [
    filters.place,
    filters.type !== 'all' ? filters.type : '',
    filters.minPrice,
    filters.maxPrice,
    !filters.includeFree ? 'excludeFree' : '',
    filters.sortBy !== 'newest' ? filters.sortBy : ''
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with Search & Filter Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              {total > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {total} listings found
                  {hasActiveFilters && ' (filtered)'}
                </p>
              )}
            </div>
          </div>

          {/* Compact Search & Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-3 items-center">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search pets, breeds, locations..."
                    value={filters.q}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => {
                  setTempFilters(filters);
                  setShowFiltersModal(true);
                }}
                className="relative bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Quick Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  const newFilters = { ...filters, sortBy: e.target.value as any };
                  setFilters(newFilters);
                  setPage(1);
                  fetchListings(1, newFilters);
                }}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Clear Filters (only show if filters are active) */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium px-2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {filters.type !== 'all' && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    Type: {filters.type === 'sell' ? 'For Sale' : 'For Adoption'}
                  </span>
                )}
                {filters.place && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    📍 {filters.place}
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || '∞'}
                  </span>
                )}
                {!filters.includeFree && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    Exclude Free
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-2 text-gray-600">Loading listings...</span>
          </div>
        ) : (
          <>
            {/* Listings Grid - Inline Rendering Using UI Models */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {uiListings.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No listings found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {hasActiveFilters
                      ? 'Try adjusting your search filters'
                      : 'Be the first to post a listing!'}
                  </p>
                </div>
              ) : (
                uiListings.map((uiListing) => (
                  <div
                    key={uiListing.id}
                    onClick={() => handleCardClick(uiListing)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  >
                    <div className="relative">
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        {uiListing.primaryImage ? (
                          <img
                            src={uiListing.primaryImage}
                            alt={uiListing.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Type Badge - Using UI Model Data */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          uiListing.type === 'sell' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {uiListing.typeLabel}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content - Using UI Model Formatted Data */}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                        {uiListing.title}
                      </h3>
                      <p className={`text-lg font-bold mb-1 ${uiListing.statusColor}`}>
                        {uiListing.displayPrice}
                      </p>
                      {uiListing.age !== 'Not specified' && (
                        <p className="text-xs text-gray-500 truncate mb-1">
                          Age: {uiListing.age}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 truncate mb-1">
                        📍 {uiListing.location}
                      </p>
                      <p className="text-xs text-gray-400">
                        {uiListing.createdDate}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, total)} of {total} results
                </div>

                <div className="flex items-center gap-2">
                  {page > 2 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                      >
                        1
                      </button>
                      {page > 3 && <span className="px-2 text-gray-400">...</span>}
                    </>
                  )}

                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2 text-sm bg-orange-600 text-white rounded">
                    {page}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>

                  {page < totalPages - 1 && (
                    <>
                      {page < totalPages - 2 && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Create Listing"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 active:scale-95 transition flex items-center justify-center z-50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
        </svg>
      </button>

  {/* Filters Modal - FIXED VERSION */}
{showFiltersModal && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    {/* ✅ FIXED: Backdrop with subtle background and proper click handling */}
    <div 
      className="absolute inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm"
      onClick={() => {
        setShowFiltersModal(false);
        resetTempFilters();
      }}
    />
    
    {/* ✅ FIXED: Modal Content with click event prevention */}
    <div 
      className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()} // Prevents backdrop close when clicking inside
    >
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filter Listings</h3>
          <button
            onClick={() => {
              setShowFiltersModal(false);
              resetTempFilters();
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-4 space-y-6">
        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="Enter location..."
            value={tempFilters.place}
            onChange={(e) => setTempFilters({ ...tempFilters, place: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={tempFilters.type}
            onChange={(e) => setTempFilters({ ...tempFilters, type: e.target.value as 'all' | 'sell' | 'adopt' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Types</option>
            <option value="sell">For Sale</option>
            <option value="adopt">For Adoption</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="flex gap-2 items-center mb-3">
            <input
              type="number"
              placeholder="Min"
              value={tempFilters.minPrice}
              onChange={(e) => setTempFilters({ ...tempFilters, minPrice: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max"
              value={tempFilters.maxPrice}
              onChange={(e) => setTempFilters({ ...tempFilters, maxPrice: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Quick Price Ranges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Under ₹1,000', min: '', max: '1000' },
              { label: '₹1,000 - ₹5,000', min: '1000', max: '5000' },
              { label: '₹5,000 - ₹10,000', min: '5000', max: '10000' },
              { label: '₹10,000 - ₹25,000', min: '10000', max: '25000' },
              { label: '₹25,000 - ₹50,000', min: '25000', max: '50000' },
              { label: 'Above ₹50,000', min: '50000', max: '' }
            ].map((range, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setTempFilters({
                  ...tempFilters,
                  minPrice: range.min,
                  maxPrice: range.max
                })}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  tempFilters.minPrice === range.min && tempFilters.maxPrice === range.max
                    ? 'bg-orange-100 border-orange-300 text-orange-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempFilters.includeFree}
              onChange={(e) => setTempFilters({ ...tempFilters, includeFree: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">Include free items</span>
          </label>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => {
            setShowFiltersModal(false);
            resetTempFilters();
          }}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            setTempFilters({
              q: filters.q,
              place: '',
              type: 'all',
              minPrice: '',
              maxPrice: '',
              sortBy: 'newest',
              includeFree: true
            });
          }}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters(tempFilters);
            setPage(1);
            fetchListings(1, tempFilters);
            setShowFiltersModal(false);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  </div>
)}


      {/* Create Listing Modal */}
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
