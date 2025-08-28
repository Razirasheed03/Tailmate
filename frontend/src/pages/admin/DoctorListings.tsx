import { useEffect, useMemo, useState } from "react";
import { adminDoctorService, type DoctorRow } from "@/services/adminDoctorService";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

type StatusFilter = "" | "pending" | "verified" | "rejected";

export default function DoctorListings() {
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<string>("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await adminDoctorService.list({ page, limit, status, search });
      setRows(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const statusBadge = (s: DoctorRow["status"]) => {
    if (s === "verified") return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Verified</span>;
    if (s === "pending") return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Rejected</span>;
  };

  const onVerify = async (userId: string) => {
    if (!confirm("Mark this doctor as Verified?")) return;
    try {
      await adminDoctorService.verify(userId);
      await fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Verify failed");
    }
  };

  const openReject = (userId: string) => {
    setRejectUserId(userId);
    setRejectReasons("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectUserId) return;
    const reasons = rejectReasons
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (reasons.length === 0) {
      alert("Enter at least one reason");
      return;
    }
    try {
      await adminDoctorService.reject(rejectUserId, reasons);
      setRejectOpen(false);
      setRejectUserId(null);
      setRejectReasons("");
      await fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Reject failed");
    }
  };

  const clearFilters = () => {
    setStatus("");
    setSearch("");
    setPage(1);
    fetchList();
  };

  const hasFilters = useMemo(() => !!status || !!search, [status, search]);

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Doctors</h1>
          <p className="text-sm text-gray-600">{total} total</p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button
            variant="outline"
            className="border-[#E5E7EB] bg-white hover:bg-white/90"
            onClick={() => {
              setPage(1);
              fetchList();
            }}
          >
            Apply
          </Button>
          {hasFilters && (
            <Button
              variant="outline"
              className="border-[#E5E7EB] bg-white hover:bg-white/90"
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Doctor</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Certificate</th>
                  <th className="text-left px-4 py-3">Submitted</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No records
                    </td>
                  </tr>
                ) : (
                  rows.map((d) => (
                    <tr key={d.userId} className="border-t">
                      <td className="px-4 py-3 font-medium">{d.username || "-"}</td>
                      <td className="px-4 py-3">{d.email || "-"}</td>
                      <td className="px-4 py-3">{statusBadge(d.status)}</td>
                      <td className="px-4 py-3">
                        {d.certificateUrl ? (
                          <a
                            href={d.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0EA5E9] hover:underline"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.submittedAt ? new Date(d.submittedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={d.status === "verified"}
                            onClick={() => onVerify(d.userId)}
                            title={d.status === "verified" ? "Already verified" : "Verify"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#E5E7EB] bg-white hover:bg-white/90 text-rose-600"
                            onClick={() => openReject(d.userId)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#E5E7EB] bg-white hover:bg-white/90"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                className="border-[#E5E7EB] bg-white hover:bg-white/90"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-2">Reject verification</h3>
            <p className="text-sm text-gray-600 mb-3">
              Enter reasons (one per line). These may be shown to the doctor.
            </p>
            <textarea
              rows={6}
              value={rejectReasons}
              onChange={(e) => setRejectReasons(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="e.g.\nLicense number missing\nDocument is blurry"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-[#E5E7EB] bg-white hover:bg-white/90"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700" onClick={submitReject}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
