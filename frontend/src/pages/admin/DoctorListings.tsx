import { useEffect, useMemo, useState } from "react";
import {
  adminDoctorService,
  type DoctorRow,
  type DoctorDetail,
} from "@/services/adminDoctorService";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

// PDF viewer (client-side, no native toolbar/download)
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

// Use CDN worker URL to avoid Vite import resolution issues
// If pinning versions, keep this in sync with your installed pdfjs-dist version.
const workerUrl = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

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

  // main profile view modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<DoctorDetail | null>(null);

  // certificate preview modal (rendered via PDF.js viewer)
  const [certOpen, setCertOpen] = useState(false);
  const [certUrl, setCertUrl] = useState<string | null>(null);

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
    if (s === "verified")
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Verified
        </span>
      );
    if (s === "pending")
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          Pending
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
        Rejected
      </span>
    );
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

  // open main profile modal
  const openView = async (userId: string) => {
    try {
      setViewOpen(true);
      setViewLoading(true);
      const data = await adminDoctorService.getDetail(userId);
      setViewData(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to load profile");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // open certificate preview modal (view-only)
  const openCertificatePreview = (url: string) => {
    setCertUrl(url);
    setCertOpen(true);
  };

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
                      {/* Doctor name opens profile modal */}
                      <td className="px-4 py-3 font-medium">
                        <button
                          type="button"
                          onClick={() => openView(d.userId)}
                          className="text-left text-[#0EA5E9] hover:underline"
                          title="View profile"
                        >
                          {d.username || "-"}
                        </button>
                      </td>
                      <td className="px-4 py-3">{d.email || "-"}</td>
                      <td className="px-4 py-3">{statusBadge(d.status)}</td>
                      <td className="px-4 py-3">
                        {d.certificateUrl ? (
                          <button
                            type="button"
                            onClick={() => openCertificatePreview(d.certificateUrl!)}
                            className="inline-flex items-center gap-1 text-[#0EA5E9] hover:underline"
                            title="View certificate"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </button>
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

      {/* Certificate Preview modal (PDF.js viewer, no download UI) */}
      {certOpen && certUrl && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Certificate</h3>
              <button
                onClick={() => {
                  setCertOpen(false);
                  setCertUrl(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-lg border overflow-hidden h-[75vh] min-h-[420px]">
                <Worker workerUrl={workerUrl}>
                  <Viewer fileUrl={certUrl} />
                </Worker>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                View-only preview using a client-side PDF renderer (no native toolbar or download UI).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main profile View modal */}
      {viewOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Doctor profile</h3>
              <button
                onClick={() => {
                  setViewOpen(false);
                  setViewData(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              {viewLoading || !viewData ? (
                <div className="text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        viewData.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          viewData.displayName || viewData.username || "Dr"
                        )}`
                      }
                      alt="avatar"
                      className="w-16 h-16 rounded-full object-cover ring-1 ring-black/5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold">
                          {viewData.displayName || viewData.username || "Doctor"}
                        </h4>
                        <span className="text-xs">
                          {viewData.status === "verified" ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Verified
                            </span>
                          ) : viewData.status === "pending" ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Rejected
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{viewData.email || "—"}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-gray-500">License</p>
                      <p className="font-medium">{viewData.licenseNumber || "—"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-gray-500">Experience</p>
                      <p className="font-medium">{viewData.experienceYears ?? "—"} years</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-gray-500">Fee (per hour)</p>
                      <p className="font-medium">
                        {viewData.consultationFee != null ? `₹${viewData.consultationFee}` : "—"}
                      </p>
                    </div>
                  <div className="p-4 rounded-xl bg-gray-50">
  <p className="text-gray-500">Certificate</p>
  {viewData.certificateUrl ? (
    <div className="flex items-center gap-3">
      {/* Keep View -> opens the inline PDF modal you already wired */}
      <button
        type="button"
        onClick={() => openCertificatePreview(viewData.certificateUrl!)}
        className="text-[#0EA5E9] hover:underline"
        title="View certificate"
      >
        View
      </button>

      {/* Add Download -> direct download link */}
      <a
        href={viewData.certificateUrl}
        download
        className="text-xs px-2 py-1 rounded-md bg-[#0EA5E9] text-white hover:bg-[#0284C7]"
        title="Download certificate"
      >
        Download
      </a>
    </div>
  ) : (
    <p className="font-medium">—</p>
  )}
</div>

                    <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                      <p className="text-gray-500">Bio</p>
                      <p className="font-medium whitespace-pre-wrap">{viewData.bio || "—"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                      <p className="text-gray-500">Verification timeline</p>
                      <p className="font-medium">
                        Submitted:{" "}
                        {viewData.submittedAt ? new Date(viewData.submittedAt).toLocaleString() : "—"}
                        {"  |  "}
                        Verified:{" "}
                        {viewData.verifiedAt ? new Date(viewData.verifiedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
              <Button
                variant="outline"
                className="border-[#E5E7EB] bg-white hover:bg-white/90"
                onClick={() => {
                  setViewOpen(false);
                  setViewData(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
