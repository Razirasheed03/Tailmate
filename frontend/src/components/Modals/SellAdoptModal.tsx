// src/components/marketplace/SellAdoptModal.tsx
import { useRef, useState } from 'react';
import { uploadPetPhoto } from '@/services/petsApiService';

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

  const pickFiles = () => fileRef.current?.click();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const next = files.slice(0, 6 - images.length).map((f) => ({ file: f, url: URL.createObjectURL(f) }));
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

    if (!title.trim()) return setErr('Title is required');
    if (!desc.trim()) return setErr('Description is required');
    if (!place.trim()) return setErr('Place is required');
    if (!contact.trim()) return setErr('Contact number is required');

    setSubmitting(true);
    try {
      // 1) Upload selected images to Cloudinary
      const photos: string[] = [];
      // parallel upload for performance
      const uploads = images.map((img) => uploadPetPhoto(img.file).then((r) => photos.push(r.url)));
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

      // TODO: call marketplace service (to be implemented after backend exists)
      // await marketplaceService.createListing(body);

      // temporary simulation:
      await new Promise((r) => setTimeout(r, 400));

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
            <label className="block text-sm text-gray-700 mb-2">Photos</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={img.url} className="w-full h-full object-cover" />
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
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
            <p className="text-xs text-gray-500 mt-1">Up to 6 images</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-700">Title</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Friendly Beagle for adoption" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700">Description</label>
            <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          {/* Price (optional) */}
          <div>
            <label className="block text-sm text-gray-700">Price (optional)</label>
            <input type="number" min="0" className="mt-1 w-full border rounded px-3 py-2"
                   value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Leave blank for adoption" />
          </div>

          {/* Age & Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">Age</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 1 year 6 months" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Place</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City / Area" />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm text-gray-700">Contact Number</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91-XXXXXXXXXX" />
          </div>

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { reset(); onClose(); }} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60">
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
