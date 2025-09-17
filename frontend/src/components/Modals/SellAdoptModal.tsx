import { useRef, useState } from 'react';
import { uploadListingPhoto } from '@/services/petsApiService';
import { marketplaceService } from '@/services/marketplaceService';
import type { DomainListing } from '@/types/api.types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function SellAdoptModal({ open, onClose, onCreated }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [age, setAge] = useState('');
  const [place, setPlace] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState<'sell' | 'adopt'>('sell'); // ✅ FIXED: Union type
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErr(null);

    // Validation
    if (!title.trim()) return setErr('Title is required');
    if (!desc.trim()) return setErr('Description is required');
    if (!place.trim()) return setErr('Place is required');
    if (!contact.trim()) return setErr('Contact is required');
    if (images.length === 0) return setErr('At least one photo is required');

    if (type === 'sell' && price.trim() && (isNaN(Number(price)) || Number(price) < 0)) {
      return setErr('Price must be a valid positive number');
    }

    setSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const img of images) {
        const result = await uploadListingPhoto(img.file);
        photoUrls.push(result.url);
      }

      // ✅ FIXED: Create properly typed domain listing
      const domainListing: Partial<DomainListing> = {
        title: title.trim(),
        description: desc.trim(),
        photos: photoUrls,
        price: (type === 'sell' && price.trim()) ? Number(price) : null,
        ageText: age.trim() || undefined,
        location: place.trim(),          // Domain model uses 'location'
        contactInfo: contact.trim(),     // Domain model uses 'contactInfo'
        type: type                       // ✅ Already properly typed as union type
      };

      const createdListing = await marketplaceService.create(domainListing);
      
      if (createdListing) {
        // Reset form
        setTitle('');
        setDesc('');
        setPrice('');
        setAge('');
        setPlace('');
        setContact('');
        setImages([]);
        setType('sell');
        
        onClose();
        onCreated();
      }
    } catch (error: any) {
      setErr(error?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const pickFiles = (): void => {
    fileRef.current?.click();
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create Listing</h3>
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
          {/* Type Selection - ✅ FIXED: Proper union type handling */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Listing Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sell"
                  checked={type === 'sell'}
                  onChange={(e) => setType(e.target.value as 'sell' | 'adopt')}
                  className="mr-2"
                />
                For Sale
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="adopt"
                  checked={type === 'adopt'}
                  onChange={(e) => setType(e.target.value as 'sell' | 'adopt')}
                  className="mr-2"
                />
                For Adoption
              </label>
            </div>
          </div>

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
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={onFiles} 
            />
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
              required
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
              required
            />
          </div>

          {/* Price (conditional based on type) */}
          {type === 'sell' && (
            <div>
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
            </div>
          )}

          {/* Age and Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Age (optional)</label>
              <input 
                type="text"
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                value={age} 
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 2 months, 1 year"
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
                required
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
              required
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
              {submitting ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
