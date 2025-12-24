//user/Profile/PetProfile.tsx
import { useEffect, useState } from "react";
import { listMyPets, updatePet, deletePet } from "@/services/petsApiService";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { PawPrint, History } from "lucide-react";
import { toast } from "sonner";
import PetHistoryModal from "@/components/Modals/petHistoryModal";

type PetItem = {
  _id: string;
  name: string;
  speciesCategoryName?: string;
  ageYears?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
};

export default function PetProfiles() {
  const [pets, setPets] = useState<PetItem[]>([]);
  const [pastPets, setPastPets] = useState<PetItem[]>([]);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // edit states
  const [editing, setEditing] = useState<PetItem | null>(null);
  const [form, setForm] = useState<{ name: string; notes: string }>({
    name: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // history modal states
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    petId: string;
    petName: string;
  }>({
    open: false,
    petId: "",
    petName: "",
  });

  const load = async (p = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listMyPets(p, 6);
      const payload = res?.data?.data !== undefined ? res.data : res;
      setPets(payload.data || []);
      setPastPets(payload.past || []);
      setPage(payload.page || 1);
      setTotalPages(payload.totalPages || 1);
    } catch (e: any) {
      console.error("Load pets error:", e);
      setErr(e?.message || "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const openEdit = (pet: PetItem) => {
    setEditing(pet);
    setForm({ name: pet.name, notes: pet.notes || "" });
  };

  const openHistory = (pet: PetItem) => {
    setHistoryModal({ open: true, petId: pet._id, petName: pet.name });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await updatePet(editing._id, {
        name: form.name.trim(),
        notes: form.notes.trim() ? form.notes.trim() : undefined,
      });
      toast.success("Pet updated successfully");
      setEditing(null);
      await load(page);
    } catch (e: any) {
      console.error("Update pet error:", e);
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to update pet"
      );
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (id: string) => setConfirmId(id);

  const performDelete = async (id: string) => {
    setConfirmId(null);
    setRemovingId(id);
    try {
      await deletePet(id);
      toast.success("Pet deleted successfully");
      setPets((prev) => prev.filter((x) => x._id !== id));
      setPastPets((prev) => prev.filter((x) => x._id !== id));
      if (pets.length === 1 && page > 1) await load(page - 1);
    } catch (e: any) {
      console.error("Delete pet error:", e);
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to delete pet"
      );
    } finally {
      setRemovingId(null);
    }
  };

  const PetCard = (p: PetItem, editable = true, showHistory = true) => (
    <Card
      key={p._id}
      className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-0.5"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] flex items-center justify-center overflow-hidden">
            {p.photoUrl ? (
              <img
                src={p.photoUrl}
                alt={p.name}
                className="w-12 h-12 object-cover rounded-xl"
              />
            ) : (
              <PawPrint className="w-6 h-6 text-[#F97316]" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-gray-600">
              {p.speciesCategoryName || "Pet"}
              {p.ageYears
                ? ` · ${p.ageYears} ${p.ageYears === 1 ? "year" : "years"}`
                : ""}
            </p>
          </div>
        </div>

        {p.notes && <p className="text-sm text-[#374151] mt-4">{p.notes}</p>}

        <div className="mt-4 flex gap-2 flex-wrap">
          {showHistory && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openHistory(p)}
              className="flex items-center gap-1"
            >
              <History className="w-3 h-3" />
              History
            </Button>
          )}
          {editable && (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestDelete(p._id)}
                disabled={removingId === p._id}
              >
                {removingId === p._id ? "Deleting…" : "Delete"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Pet Profiles</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          View all pets you currently own. Click "History" to see the pet's
          complete passport and ownership timeline.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading pets…</p>
      ) : err ? (
        <p className="text-sm text-rose-600">{err}</p>
      ) : pets.length === 0 && pastPets.length === 0 ? (
        <p className="text-sm text-gray-600">No pets yet.</p>
      ) : (
        <>
          {/* All current + bought pets */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {pets.map((p) => PetCard(p, true, true))}
          </div>

          {/* Past Pets visible only if seller has any */}
          {pastPets.length > 0 && (
            <>
              <h3 className="text-md font-medium text-gray-900 mt-6">
                Past Pets (Sold)
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastPets.map((p) => PetCard(p, false, true))}
              </div>
            </>
          )}
        </>
      )}

      {/* Edit Modal */}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Delete Pet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this pet? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => performDelete(confirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pet History Modal */}
      <PetHistoryModal
        open={historyModal.open}
        petId={historyModal.petId}
        petName={historyModal.petName}
        onClose={() => setHistoryModal({ open: false, petId: "", petName: "" })}
      />
    </div>
  );
}
