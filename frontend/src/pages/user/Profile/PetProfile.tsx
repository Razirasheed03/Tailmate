// src/pages/PetProfiles.tsx
import { useEffect, useState } from 'react';
import { listMyPets, updatePet, deletePet } from '@/services/petsApiService';
import { Button } from '@/components/UiComponents/button';
import { Card, CardContent } from '@/components/UiComponents/Card';
import { PawPrint } from 'lucide-react';

type PetItem = {
  _id: string;
  name: string;
  speciesCategoryName?: string;
  ageYears?: number | null
  notes?: string | null;
  photoUrl?: string | null;
};

export default function PetProfiles() {
  const [items, setItems] = useState<PetItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // edit modal state
  const [editing, setEditing] = useState<PetItem | null>(null);
  const [form, setForm] = useState<{ name: string; notes: string }>({ name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listMyPets(p, 6);
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

  const openEdit = (pet: PetItem) => {
    setEditing(pet);
    setForm({ name: pet.name, notes: pet.notes || '' });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await updatePet(editing._id, {
        name: form.name.trim(),
        // backend expects undefined instead of empty string for optional fields
        notes: form.notes.trim() ? form.notes.trim() : undefined,
      });
      setEditing(null);
      await load(page);
    } catch (e: any) {
      alert(e?.message || 'Failed to update pet');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm('Delete this pet? This cannot be undone.')) return;
    setRemovingId(id);
    try {
      await deletePet(id);
      // Optimistic removal
      setItems((prev) => prev.filter((x) => x._id !== id));
      // If list becomes short, reload current page to keep pagination consistent
      if (items.length === 1 && page > 1) {
        await load(page - 1);
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to delete pet');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Pet Profiles</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          View, edit, and delete pet profiles.
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
                    <div className="flex-1">
                      <p className="font-semibold">{p.name}</p>
                   {p.speciesCategoryName || 'Pet'}
{p.ageYears !== null && p.ageYears !== undefined ? ` · ${p.ageYears} ${p.ageYears === 1 ? "year" : "years"}` : ""}

                    </div>
                  </div>

                  {p.notes && <p className="text-sm text-[#374151] mt-4">{p.notes}</p>}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => doDelete(p._id)} disabled={removingId === p._id}>
                      {removingId === p._id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
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

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-3">Edit Pet</h3>
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Name</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.name}
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Notes</label>
                <textarea
                  className="border rounded px-3 py-2 w-full"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
