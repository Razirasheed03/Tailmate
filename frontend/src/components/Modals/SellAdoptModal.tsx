// src/components/marketplace/SellAdoptModal.tsx
import { useRef, useState } from 'react';
import { uploadListingPhoto } from '@/services/petsApiService';
import { marketplaceService } from '@/services/marketplaceService';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // refresh list
};

type LocalImage = { file: File; url: string };

export default function SellAdoptModal({ open, onClose, onCreated }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<string>(''); // blank => adoption
  const [age, setAge] = useState('');
  const [place, setPlace] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ ADDED: Allowed image formats
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // ✅ ADDED: Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    // Supports formats: +91-1234567890, +911234567890, 1234567890, +91 1234567890
    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const pickFiles = () => fileRef.current?.click();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    
    // ✅ ADDED: Validate file types and sizes
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Only JPEG, PNG, WebP, and GIF formats are allowed`);
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than 5MB`);
        return;
      }
      
      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      setErr(errors.join(', '));
      return;
    } else {
      setErr(null); // Clear previous errors
    }

    // Process valid files
    const availableSlots = 6 - images.length;
    const filesToAdd = validFiles.slice(0, availableSlots);
    
    if (validFiles.length > availableSlots) {
      setErr(`Only ${availableSlots} more images can be added (maximum 6 total)`);
    }

    const next = filesToAdd.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].url);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setTitle('');
    setDesc('');
    setPrice('');
    setAge('');
    setPlace('');
    setContact('');
    setErr(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // ✅ ADDED: At least one photo validation
    if (images.length === 0) {
      return setErr('At least one photo is required');
    }

    if (!title.trim()) return setErr('Title is required');
    if (!desc.trim()) return setErr('Description is required');
    if (desc.trim().length < 10) return setErr('Description must be at least 10 characters');
    if (!place.trim()) return setErr('Place is required');
    if (!contact.trim()) return setErr('Contact number is required');

    // ✅ ADDED: Phone number format validation
    if (!validatePhoneNumber(contact.trim())) {
      return setErr('Please enter a valid Indian phone number ');
    }

    // ✅ ADDED: Price validation (if provided)
    if (price.trim() && (isNaN(Number(price)) || Number(price) < 0)) {
      return setErr('Price must be a valid positive number');
    }

    setSubmitting(true);
    try {
      // 1) Upload selected images to Cloudinary
      const photos: string[] = [];
      // parallel upload for performance
      const uploads = images.map((img) => uploadListingPhoto(img.file).then((r) => photos.push(r.url)));
      await Promise.all(uploads);

      // 2) Build listing payload (backend will be added next)
      const body = {
        title: title.trim(),
        description: desc.trim(),
        photos,
        price: price.trim() ? Number(price) : null, // null => adoption
        ageText: age.trim(),
        place: place.trim(),
        contact: contact.trim(),
        type: price.trim() ? 'sell' : 'adopt', // convenience for filters
      };

      await marketplaceService.create(body);

      reset();
      onClose();
      onCreated();
    } catch (e: any) {
      setErr(e?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-lg">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{price ? 'Sell Pet' : 'List for Adoption'}</h3>
            <button onClick={() => { reset(); onClose(); }} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Photos */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Photos <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={img.url} className="w-full h-full object-cover" alt={`Upload ${idx + 1}`} />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-6 h-6 text-xs">×</button>
                </div>
              ))}
              {images.length < 6 && (
                <button type="button" onClick={pickFiles}
                        className="w-20 h-20 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400">
                  +
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" multiple className="hidden" onChange={onFiles} />
            <p className="text-xs text-gray-500 mt-1">
              Up to 6 images • JPEG, PNG, WebP, GIF • Max 5MB each
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Friendly Beagle for adoption" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the pet's temperament, health, training status, etc. (min 10 characters)" />
          </div>

          {/* Price (optional) */}
          <div>
            <label className="block text-sm text-gray-700">Price (optional)</label>
            <input type="number" min="0" step="1" className="mt-1 w-full border rounded px-3 py-2"
                   value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Leave blank for adoption" />
            <p className="text-xs text-gray-500 mt-1">Leave empty for free adoption</p>
          </div>

          {/* Age & Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">Age</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 1 year 6 months" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">
                Place <span className="text-red-500">*</span>
              </label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City / Area" />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm text-gray-700">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Add a valid indian number" />
            <p className="text-xs text-gray-500 mt-1">Indian mobile number</p>
          </div>

          {err && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { reset(); onClose(); }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60 hover:bg-orange-700 disabled:hover:bg-orange-600">
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
