// src/pages/marketplace/SellAdoptModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { marketplaceService } from '@/services/marketplaceService';
import { updatePet } from '@/services/petsApiService';
import { PetSelectDialog } from '../../pages/pets/PetSelectDialog';
import { uploadListingPhoto } from '@/services/petsApiService';

type Props = { open: boolean; onClose: () => void; onCreated: () => void; };

type PickedPet = { _id: string; name: string; photoUrl?: string };

export default function SellAdoptModal({ open, onClose, onCreated }: Props) {
  const [pickedPet, setPickedPet] = useState<PickedPet | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [age, setAge] = useState('');
  const [place, setPlace] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState<'sell' | 'adopt'>('sell');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
   const [petDialogOpen, setPetDialogOpen] = useState(false);

  // Additional photos state
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_TOTAL = 6; // optional UI cap

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const pickFiles = (): void => fileRef.current?.click();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach((f) => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) { errors.push(`${f.name}: unsupported type`); return; }
      if (f.size > MAX_FILE_SIZE) { errors.push(`${f.name}: >5MB`); return; }
      valid.push(f);
    });

    const existing = images.length;
    const availableSlots = Math.max(0, MAX_TOTAL - existing); // UI rule
    const toAdd = valid.slice(0, availableSlots);

    if (errors.length) setErr(errors.join(', '));
    if (valid.length > availableSlots) setErr(`Only ${availableSlots} more images can be added`);

    const newImages = toAdd.map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (idx: number): void => {
    setImages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].url);
      copy.splice(idx, 1);
      return copy;
    });
  };

  useEffect(() => {
    return () => {
      images.forEach(img => { try { URL.revokeObjectURL(img.url); } catch {} });
    };
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErr(null);

    if (!pickedPet) return setErr('Please select a pet from your profile');
    if (!title.trim()) return setErr('Title is required');
    if (!desc.trim() || desc.trim().length < 10) return setErr('Description must be at least 10 characters');
    if (!place.trim()) return setErr('Location is required');
    if (!contact.trim()) return setErr('Contact is required');
    if (!validatePhoneNumber(contact.trim())) return setErr('Please enter a valid Indian phone number');
    if (type === 'sell' && price.trim() && (isNaN(Number(price)) || Number(price) < 0)) return setErr('Price must be a valid positive number');

    setSubmitting(true);
    setUploadingPhotos(true);
    try {
      const uploaded: string[] = [];
      for (const img of images) {
        const res = await uploadListingPhoto(img.file);
        uploaded.push(res.url);
      }
      const photos: string[] = [];
      if (pickedPet.photoUrl) photos.push(pickedPet.photoUrl);
      photos.push(...uploaded);
      const listingData: any = {
  petId: pickedPet._id,
  title: title.trim(),
  description: desc.trim(),
  photos,
  price: type === 'sell' && price.trim() ? Number(price) : null, // null => adopt
  ageText: age.trim() ? age.trim() : '',
  place: place.trim(),
  contact: contact.trim(),
};

      const createdListing = await marketplaceService.create(listingData);
      try {
        await updatePet(pickedPet._id, {});
      } catch {}

      if (createdListing) {
        // Reset form
        setPickedPet(null);
        setTitle(''); setDesc(''); setPrice(''); setAge(''); setPlace(''); setContact('');
        setType('sell');
        images.forEach(i => { try { URL.revokeObjectURL(i.url); } catch {} });
        setImages([]);
        onClose();
        onCreated();
      }
    } catch (error: any) {
      setErr(error?.message || 'Failed to create listing');
    } finally {
      setUploadingPhotos(false);
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create Listing</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" type="button" aria-label="Close dialog">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
          {/* Pet chooser */}
         <section>
    <label className="block text-sm text-gray-700 mb-2">Choose Pet <span className="text-red-500">*</span></label>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setPetDialogOpen(true)}
        className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
      >
        {pickedPet ? 'Change pet' : 'Select pet'}
      </button>
      {pickedPet && (
        <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
          {pickedPet.photoUrl && <img src={pickedPet.photoUrl} alt="" className="w-7 h-7 rounded object-cover border" />}
          <div className="text-sm">
            <div className="font-medium leading-tight">{pickedPet.name}</div>
          </div>
        </div>
      )}
    </div>

    <PetSelectDialog
      open={petDialogOpen}
      onClose={() => setPetDialogOpen(false)}
      onPick={(p) => {
        setPickedPet(p);
        if (!title.trim()) {
          setTitle(`${p.name} - ${type === 'sell' ? 'For Sale' : 'For Adoption'}`);
        }
      }}
    />
  </section>

          {/* Additional photos */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">Additional photos (optional)</label>
              <button
                type="button"
                onClick={pickFiles}
                className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                Add photos
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              multiple
              className="hidden"
              onChange={onFiles}
            />
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={img.url} className="w-full h-full object-cover" alt={`Upload ${idx + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-6 h-6 text-xs hover:bg-black/90"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, GIF • Max 5MB each • Up to 6 total previews</p>
          </section>

          {/* Type */}
          <section>
            <label className="block text-sm text-gray-700 mb-2">Listing Type <span className="text-red-500">*</span></label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" value="sell" checked={type === 'sell'} onChange={(e) => setType(e.target.value as 'sell' | 'adopt')} className="mr-2" />
                For Sale
              </label>
              <label className="flex items-center">
                <input type="radio" value="adopt" checked={type === 'adopt'} onChange={(e) => setType(e.target.value as 'sell' | 'adopt')} className="mr-2" />
                For Adoption
              </label>
            </div>
          </section>

          {/* Title and Description */}
          <section>
            <label className="block text-sm text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter listing title"
            />
          </section>

          <section>
            <label className="block text-sm text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe your pet..."
            />
          </section>

          {/* Price / Age / Place / Contact */}
          {type === 'sell' && (
            <section>
              <label className="block text-sm text-gray-700 mb-1">Price</label>
              <input
                type="number"
                min="0"
                step="1"
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
              />
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Age (in years)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 0.5, 1, 2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="City, State"
              />
            </div>
          </section>

          <section>
            <label className="block text-sm text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+91 9xxxxxxxxx"
            />
          </section>

          {/* Error */}
          {err && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">{err}</div>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors" disabled={submitting || uploadingPhotos}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || uploadingPhotos} className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60 hover:bg-orange-700 transition-colors">
              {submitting || uploadingPhotos ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
