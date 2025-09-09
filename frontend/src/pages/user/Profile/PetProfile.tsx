// src/pages/PetProfiles.tsx
import { useEffect, useState } from 'react';
import { listMyPets } from '@/services/petsApiService';
import { Button } from '@/components/UiComponents/button';
import { Card, CardContent } from '@/components/UiComponents/Card';
import { PawPrint } from 'lucide-react';

type PetItem = {
  _id: string;
  name: string;
  speciesCategoryName?: string;
  ageDisplay?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
};

export default function PetProfiles() {
  const [items, setItems] = useState<PetItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listMyPets(p, 6);
      // Support either envelope { success, data: { data, page, totalPages } } or flat { data, page, totalPages }
      const payload = (res?.data && (res.data.data !== undefined)) ? res.data : res;
      setItems(payload.data || []);
      setPage(payload.page || p);
      setTotalPages(payload.totalPages || 1);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Pet Profiles</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          View and manage your pet profiles.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading pets…</p>
      ) : err ? (
        <p className="text-sm text-rose-600">{err}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600">No pets yet.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <Card key={p._id} className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] flex items-center justify-center overflow-hidden">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                      ) : (
                        <PawPrint className="w-6 h-6 text-[#F97316]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-[#6B7280]">
                        {p.speciesCategoryName || 'Pet'}{p.ageDisplay ? ` · ${p.ageDisplay}` : ''}
                      </p>
                    </div>
                  </div>
                  {p.notes && <p className="text-sm text-[#374151] mt-4">{p.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}
