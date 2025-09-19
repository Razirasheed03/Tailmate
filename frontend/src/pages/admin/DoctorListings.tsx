import { useEffect, useMemo, useState } from 'react';
import { adminDoctorService, type DoctorRow, type DoctorDetail } from '@/services/adminDoctorService';
import { Card, CardContent } from '@/components/UiComponents/Card';
import { Button } from '@/components/UiComponents/button';
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';

import { Table } from '@/components/table/Table';
import type { ColumnDef } from '@/components/table/types';
import { TableToolbar } from '@/components/table/TableToolbar';
import { TablePagination } from '@/components/table/TablePagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';

// PDF viewer
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Keep workerUrl, ensure version matches your installed pdfjs-dist
const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

type StatusFilter = '' | 'pending' | 'verified' | 'rejected';

export default function DoctorListings() {
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<string>('');

  // view modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<DoctorDetail | null>(null);

  // certificate preview
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
      alert(e?.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const columns = useMemo<ColumnDef<DoctorRow>[]>(() => [
    {
      id: 'doctor',
      header: 'Doctor',
      cell: (d) => (
        <button
          type="button"
          onClick={() => openView(d.userId)}
          className="text-left text-[#0EA5E9] hover:underline"
          title="View profile"
        >
          {d.username || '-'}
        </button>
      ),
    },
    { id: 'email', header: 'Email', cell: (d) => d.email || '-' },
    {
      id: 'status',
      header: 'Status',
      cell: (d) => <StatusBadge status={d.status === 'verified' ? 'verified' : d.status === 'pending' ? 'pending' : 'rejected'} />,
    },
    {
      id: 'certificate',
      header: 'Certificate',
      cell: (d) =>
        d.certificateUrl ? (
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
        ),
    },
    {
      id: 'submitted',
      header: 'Submitted',
      cell: (d) => (d.submittedAt ? new Date(d.submittedAt).toLocaleString() : '—'),
    },
    {
      id: 'actions',
      header: <div className="text-right">Actions</div>,
      cell: (d) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={d.status === 'verified'}
            onClick={() => onVerify(d.userId)}
            title={d.status === 'verified' ? 'Already verified' : 'Verify'}
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
      ),
      headerClassName: 'text-right',
    },
  ], []);

  const onVerify = async (userId: string) => {
    if (!confirm('Mark this doctor as Verified?')) return;
    try {
      await adminDoctorService.verify(userId);
      await fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Verify failed');
    }
  };

  const openReject = (userId: string) => {
    setRejectUserId(userId);
    setRejectReasons('');
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectUserId) return;
    const reasons = rejectReasons.split('\n').map((s) => s.trim()).filter(Boolean);
    if (reasons.length === 0) {
      alert('Enter at least one reason');
      return;
    }
    try {
      await adminDoctorService.reject(rejectUserId, reasons);
      setRejectOpen(false);
      setRejectUserId(null);
      setRejectReasons('');
      await fetchList();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Reject failed');
    }
  };

  const hasFilters = useMemo(() => !!status || !!search, [status, search]);

  const openView = async (userId: string) => {
    try {
      setViewOpen(true);
      setViewLoading(true);
      const data = await adminDoctorService.getDetail(userId);
      setViewData(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load profile');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openCertificatePreview = (url: string) => {
    setCertUrl(url);
    setCertOpen(true);
  };

  const clearFilters = () => {
    setStatus('');
    setSearch('');
    setPage(1);
    fetchList();
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        filters={
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
        }
        onApply={() => {
          setPage(1);
          fetchList();
        }}
        onClear={clearFilters}
        hasFilters={hasFilters}
        title="Doctors"
        subtitle={`${total} total`}
      />

      <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
        <CardContent className="p-0">
          <Table<DoctorRow>
            columns={columns}
            data={rows}
            loading={loading}
            emptyText="No records"
            ariaColCount={columns.length}
            ariaRowCount={rows.length}
            getRowKey={(r) => r.userId}
            renderLoadingRow={() => (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Loading...
              </>
            )}
          />
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            leftText={`Page ${page} of ${totalPages}`}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        open={rejectOpen}
        title="Reject verification"
        description="Enter reasons (one per line). These may be shown to the doctor."
        onClose={() => setRejectOpen(false)}
        onConfirm={submitReject}
        confirmText="Reject"
        danger
      >
        <textarea
          rows={6}
          value={rejectReasons}
          onChange={(e) => setRejectReasons(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="e.g.
License number missing
Document is blurry"
        />
      </ConfirmModal>

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
