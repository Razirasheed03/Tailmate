// src/pages/pets/PetCreateForm.tsx
import * as React from "react";
import { Button } from "@/components/UiComponents/button";
import { createPet, uploadPetPhoto } from "@/services/petsApiService";

type Props = {
  speciesCategoryId: string;
  speciesCategoryName: string;
  onCancel: () => void;
  onCreated: (pet: any) => void;
};

export function PetCreateForm({
  speciesCategoryId,
  speciesCategoryName,
  onCancel,
  onCreated,
}: Props) {
  const [name, setName] = React.useState("");
  const [sex, setSex] = React.useState<"male" | "female" | "unknown">(
    "unknown"
  );
  // interpret input as "age in years" (string to support empty)
  const [ageYears, setAgeYears] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // photo state
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const onFileChange = (file: File | null) => {
    setErr(null);
    setPhotoFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setPhotoUrl(undefined);
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const computeBirthDateFromAge = (yearsStr: string): string | undefined => {
    if (!yearsStr.trim()) return undefined;
    const years = Number(yearsStr);
    if (isNaN(years) || years < 0) return undefined;
    const ms = years * 365.25 * 24 * 60 * 60 * 1000; // approx.
    return new Date(Date.now() - ms).toISOString();
  };

  const validate = React.useCallback((): string | null => {
    if (!name.trim()) return "Pet name is required";
    if (!ageYears.trim()) return "Age is required";
    const n = Number(ageYears);
    if (isNaN(n) || n < 0) return "Age must be a valid non-negative number";
    if (!photoUrl && !photoFile) return "At least one photo is required";
    return null;
  }, [name, ageYears, photoUrl, photoFile]);

  // Change doUpload to return the URL
  const doUpload = async (): Promise<string | undefined> => {
    if (!photoFile) return undefined;
    if (!ALLOWED_IMAGE_TYPES.includes(photoFile.type)) {
      setErr("Only JPEG, PNG, WebP, and GIF formats are allowed");
      return;
    }
    if (photoFile.size > MAX_FILE_SIZE) {
      setErr("File size must be less than 5MB");
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadPetPhoto(photoFile);
      setPhotoUrl(url); // keep state for UI
      return url; // return for immediate use
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      let url = photoUrl;
      if (photoFile && !url) {
        url = await doUpload(); // get immediate URL
      }
      if (!url) {
        setErr("Photo upload failed, please try again");
        return;
      }

      const payload = {
        name: name.trim(),
        speciesCategoryId,
        sex,
        birthDate: computeBirthDateFromAge(ageYears),
        notes: notes || undefined,
        photoUrl: url, // use local url
      };
      const pet = await createPet(payload);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPhotoFile(null);
      onCreated(pet);
    } catch (e: any) {
      setErr(e?.message || "Failed to save pet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={`space-y-4 transition-opacity ${
    saving ? "opacity-70 pointer-events-none" : ""
  }`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Pet name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full border rounded-lg p-2 text-sm"
            placeholder="e.g., Bella"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Category</label>
          <input
            value={speciesCategoryName}
            disabled
            className="mt-1 w-full border rounded-lg p-2 text-sm bg-gray-50"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as any)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          >
            <option value="unknown">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Age (Years)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={ageYears}
            onChange={(e) => setAgeYears(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
            placeholder="e.g., 0.5, 1, 2"
          />
        </div>

        {/* Photo picker */}
        <div className="sm:col-span-2">
          <label className="text-sm text-gray-600">Photo</label>
          <div className="mt-2 flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded border"
              />
            ) : (
              <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center text-gray-400 text-sm">
                No photo
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            JPEG, PNG, WebP, GIF • Max 5MB
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-gray-600">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      {err && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">
          {err}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-[#E5E7EB] bg-white hover:bg-white/90"
          onClick={onCancel}
        >
          Cancel
        </Button>
<Button
  type="submit"
  disabled={saving}
  className="bg-[#F97316] hover:bg-[#EA580C]"
>
  {saving
    ? uploading
      ? "Uploading photo…"
      : "Saving pet…"
    : "Save Pet"}
</Button>

      </div>
    </form>
  );
}
