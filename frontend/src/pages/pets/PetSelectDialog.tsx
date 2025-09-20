// src/components/pets/PetSelectDialog.tsx
import * as React from 'react';
import { listMyPets } from '@/services/petsApiService';

type Pet = { _id: string; name: string; photoUrl?: string };

export function PetSelectDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (p: Pet) => void;
}) {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Pet[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await listMyPets(1, 50); // fetch once; filter client-side
        const data: Pet[] = res?.data ?? res ?? [];
        setItems(data);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load pets');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((p) => p.name.toLowerCase().includes(qq) || p._id.toLowerCase().includes(qq));
  }, [q, items]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h4 className="text-base font-semibold">Select a Pet</h4>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or ID"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Search pets"
          />
        </div>

        {/* Body */}
        <div className="p-5 pt-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {loading && <p className="text-sm text-gray-600">Loading pets…</p>}
          {err && <p className="text-sm text-rose-600">{err}</p>}
          {!loading && !err && filtered.length === 0 && (
            <p className="text-sm text-gray-600">No pets match the search</p>
          )}

          {/* Accessible listbox */}
          <div role="listbox" aria-label="Pet list" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <button
                key={p._id}
                role="option"
                onClick={() => { onPick(p); onClose(); }}
                className="flex items-center gap-3 border rounded-xl p-3 text-left hover:shadow"
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    {p.name[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-500 truncate">{p._id}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
