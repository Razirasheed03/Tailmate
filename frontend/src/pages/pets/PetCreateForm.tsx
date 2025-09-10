// src/pages/pets/PetCreateForm.tsx
import * as React from 'react';
import { Button } from '@/components/UiComponents/button';
import { createPet, uploadPetPhoto } from '@/services/petsApiService';

type Props = {
  speciesCategoryId: string;
  speciesCategoryName: string;
  onCancel: () => void;
  onCreated: (pet: any) => void;
};

export function PetCreateForm({ speciesCategoryId, speciesCategoryName, onCancel, onCreated }: Props) {
  const [name, setName] = React.useState('');
  const [sex, setSex] = React.useState<'male' | 'female' | 'unknown'>('unknown');
  const [birthDate, setBirthDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const onFileChange = (f: File | null) => {
    setPhotoFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setPhotoUrl(undefined);
  };

  React.useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

const doUpload = async () => {
  if (!photoFile) return;
  setUploading(true);
  try {
    const { url } = await uploadPetPhoto(photoFile);
    setPhotoUrl(url);
  } finally {
    setUploading(false);
  }
};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        speciesCategoryId,
        sex,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
        notes: notes || undefined,
        photoUrl,
      };
      const pet = await createPet(payload);
      onCreated(pet);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
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
          <input value={speciesCategoryName} disabled className="mt-1 w-full border rounded-lg p-2 text-sm bg-gray-50" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value as any)} className="mt-1 w-full border rounded-lg p-2 text-sm">
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
    max="30"
    value={birthDate}
    onChange={(e) => setBirthDate(e.target.value)}
    className="mt-1 w-full border rounded-lg p-2 text-sm"
    placeholder="Enter age in years"
  />
</div>

        <div className="sm:col-span-2">
          <label className="text-sm text-gray-600">Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="border-[#E5E7EB] bg-white hover:bg-white/90" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#F97316] hover:bg-[#EA580C]">
          {saving ? 'Saving…' : 'Save Pet'}
        </Button>
      </div>
    </form>
  );
}
