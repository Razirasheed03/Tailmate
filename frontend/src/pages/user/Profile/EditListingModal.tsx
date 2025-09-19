// src/pages/user/profile/EditListingModal.tsx
import { useRef, useState } from 'react';
import { uploadListingPhoto } from '@/services/petsApiService';
import { marketplaceService } from '@/services/marketplaceService';
import React from 'react';

// Simplified interface using raw data
interface Props {
  open: boolean;
  listing: any; // Use raw API data instead of DomainListing
  onClose: () => void;
  onUpdated: () => void;
}

type LocalImage = { file: File; url: string } | { file: null; url: string; existing: true };

export default function EditListingModal({ open, listing, onClose, onUpdated }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  
  // Initialize with raw API field names
  const [images, setImages] = useState<LocalImage[]>(
    (listing.photos || []).map((url: string) => ({ file: null, url, existing: true }))
  );
  const [title, setTitle] = useState<string>(listing.title || '');
  const [desc, setDesc] = useState<string>(listing.description || '');
  const [price, setPrice] = useState<string>(listing.price?.toString() || '');
  const [age, setAge] = useState<string>(listing.age_text?.toString() || listing.ageText?.toString() || ''); // Handle both field names
  const [place, setPlace] = useState<string>(listing.place || listing.location || ''); // Handle both field names
  const [contact, setContact] = useState<string>(listing.contact || listing.contactInfo || ''); // Handle both field names
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const pickFiles = (): void => {
    fileRef.current?.click();
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    
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

    if (errors.length > 0) {
      setErr(errors.join(', '));
      return;
    } else {
      setErr(null);
    }

    const availableSlots = 6 - images.length;
    const filesToAdd = validFiles.slice(0, availableSlots);
    
    if (validFiles.length > availableSlots) {
      setErr(`Only ${availableSlots} more images can be added (maximum 6 total)`);
    }

    const next = filesToAdd.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeImage = (idx: number): void => {
    setImages((prev) => {
      const copy = [...prev];
      const img = copy[idx];
      if (img.file) {
        URL.revokeObjectURL(img.url);
      }
      copy.splice(idx, 1);
      return copy;
    });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErr(null);

    if (images.length === 0) {
      return setErr('At least one photo is required');
    }

    if (!title.trim()) return setErr('Title is required');
    if (!desc.trim()) return setErr('Description is required');
    if (desc.trim().length < 10) return setErr('Description must be at least 10 characters');
    if (!place.trim()) return setErr('Place is required');
    if (!contact.trim()) return setErr('Contact number is required');

    if (!validatePhoneNumber(contact.trim())) {
      return setErr('Please enter a valid Indian phone number');
    }

    if (price.trim() && (isNaN(Number(price)) || Number(price) < 0)) {
      return setErr('Price must be a valid positive number');
    }

    setSubmitting(true);
    try {
      // Upload new images
      const photos: string[] = [];
      
      for (const img of images) {
        if ('existing' in img && img.existing) {
          // Keep existing photo
          photos.push(img.url);
        } else if (img.file) {
          // Upload new photo
          const result = await uploadListingPhoto(img.file);
          photos.push(result.url);
        }
      }

      // Simple update payload using API field names
      const updateData = {
        title: title.trim(),
        description: desc.trim(),
        photos,
        price: price.trim() ? Number(price) : null,
        age_text: age.trim() ? Number(age.trim()) : undefined, // Use API field name
        place: place.trim(), // Use API field name
        contact: contact.trim(), // Use API field name
      };

      // Get listing ID (handle both _id and id)
      const listingId = listing._id || listing.id;

      // Update using raw data
      const updatedListing = await marketplaceService.updateListing(listingId, updateData);
      
      if (updatedListing) {
        onClose();
        onUpdated();
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.file && img.url) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Listing</h3>
            <button 
              onClick={onClose} 
              className="p-1 rounded hover:bg-gray-100"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
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
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-6 h-6 text-xs hover:bg-black/90"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <button 
                  type="button" 
                  onClick={pickFiles} 
                  className="w-20 h-20 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                >
                  +
                </button>
              )}
            </div>
            <input 
              ref={fileRef} 
              type="file" 
              accept=".jpg,.jpeg,.png,.webp,.gif" 
              multiple 
              className="hidden" 
              onChange={onFiles} 
            />
            <p className="text-xs text-gray-500 mt-1">Up to 6 images • JPEG, PNG, WebP, GIF • Max 5MB each</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter listing title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea 
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              rows={4} 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe your pet..."
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Price (optional)</label>
            <input 
              type="number" 
              min="0" 
              step="1" 
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="Leave blank for adoption"
            />
          </div>

          {/* Age and Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-sm text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                value={place} 
                onChange={(e) => setPlace(e.target.value)}
                placeholder="City, State"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input 
              type="tel"
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
              value={contact} 
              onChange={(e) => setContact(e.target.value)}
              placeholder="+91 9xxxxxxxxx"
            />
          </div>

          {/* Error Message */}
          {err && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">
              {err}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60 hover:bg-orange-700 transition-colors"
            >
              {submitting ? 'Updating…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
