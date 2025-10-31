// frontend/src/pages/user/Bookings.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import userService from "@/services/userService";
import type { BookingRow, BookingStatus, UIMode } from "@/types/booking.types";

const Bookings = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<"upcoming" | "today" | "past" | "all">(
    "upcoming"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [modeFilter, setModeFilter] = useState<UIMode | "">("");

  const limit = 10;

  useEffect(() => {
    fetchBookings();
  }, [page, scope, statusFilter, modeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, scope };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      if (modeFilter) params.mode = modeFilter;

      const { data, total: totalCount } = await userService.listBookings(
        params
      );
      setBookings(data);
      setTotal(totalCount);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const { success, message } = await userService.cancelBooking(bookingId);
      if (success) {
        toast.success(message || "Booking cancelled successfully");
        fetchBookings();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel booking");
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getModeIcon = (mode: UIMode) => {
    const icons = {
      video: "📹",
      audio: "🎙️",
      inPerson: "🏥",
    };
    return icons[mode] || "📅";
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            View and manage your appointments
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by doctor name, pet name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Scope Filter */}
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as any);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
              <option value="all">All</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setModeFilter("");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                !modeFilter
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              All Modes
            </button>
            <button
              onClick={() => {
                setModeFilter("video");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                modeFilter === "video"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              📹 Video
            </button>
            <button
              onClick={() => {
                setModeFilter("audio");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                modeFilter === "audio"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              🎙️ Audio
            </button>
            <button
              onClick={() => {
                setModeFilter("inPerson");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                modeFilter === "inPerson"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              🏥 In-Person
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* Doctor Info */}
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      {booking.doctorProfilePic ? (
                        <img
                          src={booking.doctorProfilePic}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        "👨‍⚕️"
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.doctorName || "Dr. Unknown"}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status.toUpperCase()}
                        </span>
                        <span className="text-2xl">
                          {getModeIcon(booking.mode)}
                        </span>
                      </div>

                      {booking.doctorSpecialty && (
                        <p className="text-sm text-gray-600 mb-3">
                          {booking.doctorSpecialty}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">
                            {booking.date}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="font-medium text-gray-900">
                            {booking.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pet Name</p>
                          <p className="font-medium text-gray-900">
                            {booking.petName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium text-gray-900">
                            {booking.currency} {booking.amount}
                          </p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">Notes:</p>
                          <p className="text-sm text-gray-700">
                            {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {booking.status === "paid" && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === "pending" && (
                      <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium">
                        Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
