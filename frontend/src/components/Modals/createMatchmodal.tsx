import React, { useState, useRef, useEffect } from "react";
import { matchmakingService } from "@/services/matchMakingServices";
import { uploadListingPhoto } from "@/services/petsApiService";
import { PetSelectDialog } from "@/pages/pets/PetSelectDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateMatchmakingModal({ open, onClose, onCreated }: Props) {
  const [pickedPet, setPickedPet] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [place, setPlace] = useState("");
  const [contact, setContact] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [petDialogOpen, setPetDialogOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const pickFiles = () => fileRef.current?.click();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    const newImages = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImages((prev) => {
      const arr = [...prev];
      URL.revokeObjectURL(arr[i].url);
      arr.splice(i, 1);
      return arr;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!pickedPet) return setErr("Please choose a pet");
    if (!title.trim()) return setErr("Title required");
    if (!desc.trim()) return setErr("Description required");
    if (!place.trim()) return setErr("Place required");
    if (!contact.trim()) return setErr("Contact required");

    setSubmitting(true);
    setUploadingPhotos(true);

    try {
      // Upload extra photos
      const uploaded: string[] = [];
      for (const img of images) {
        const res = await uploadListingPhoto(img.file);
        uploaded.push(res.url);
      }
      const photos: string[] = [];
      if (pickedPet.photoUrl) photos.push(pickedPet.photoUrl);
      photos.push(...uploaded);

      const payload = {
        petId: pickedPet._id,
        title: title.trim(),
        description: desc.trim(),
        photos,
        place: place.trim(),
        contact: contact.trim(),
      };

      await matchmakingService.create(payload);

      // Reset
      setPickedPet(null);
      setTitle("");
      setDesc("");
      setPlace("");
      setContact("");
      setImages([]);

      onClose();
      onCreated();
    } catch (error: any) {
      console.error(error);
      setErr("Failed to create matchmaking listing");
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <form onSubmit={submit} className="p-5 space-y-5">
          <h2 className="text-xl font-bold">Create Matchmaking Listing</h2>

          {/* PET PICKER */}
          <div>
            <label className="text-sm text-gray-700">Choose Pet *</label>
            <button
              type="button"
              onClick={() => setPetDialogOpen(true)}
              className="block mt-1 px-3 py-2 border rounded"
            >
              {pickedPet ? pickedPet.name : "Select Pet"}
            </button>

            <PetSelectDialog
              open={petDialogOpen}
              onClose={() => setPetDialogOpen(false)}
              onPick={(p) => {
                setPickedPet(p);
                if (!title.trim()) setTitle(`Looking for mate - ${p.name}`);
              }}
            />
          </div>

          {/* IMAGES */}
          <div>
            <label className="text-sm text-gray-700">Upload Photos (optional)</label>
            <button
              type="button"
              onClick={pickFiles}
              className="mt-1 px-3 py-2 border rounded"
            >
              Add Photos
            </button>

            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*"
              onChange={onFiles}
            />

            <div className="flex flex-wrap gap-3 mt-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                  <img src={img.url} className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0 right-0 bg-black/70 text-white px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TITLE */}
          <div>
            <label className="text-sm">Title *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm">Description *</label>
            <textarea
              className="w-full border rounded px-3 py-2 h-24"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* PLACE */}
          <div>
            <label className="text-sm">Place *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          {/* CONTACT */}
          <div>
            <label className="text-sm">Contact *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          {/* ERROR */}
          {err && (
            <div className="text-red-600 text-sm bg-red-100 px-3 py-2 rounded">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-600 text-white rounded"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
