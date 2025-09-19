// src/pages/pets/PetCategoryPicker.tsx
import * as React from 'react';
import { getActiveCategories } from '@/services/petsApiService';
import type { PetCategory } from '@/services/petsApiService';

export function PetCategoryPicker({ onPick }: { onPick: (c: PetCategory) => void }) {
  const [items, setItems] = React.useState<PetCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const cats = await getActiveCategories();
        setItems(cats);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-gray-600">Loading categories…</p>;
  if (err) return <p className="text-sm text-rose-600">{err}</p>;
  if (items.length === 0) return <p className="text-sm text-gray-600">No categories</p>;

  return (
<div className="flex gap-4 overflow-x-auto pb-2">
  {items.map((c) => (
    <button
      key={c._id}
      onClick={() => onPick(c)}
      className="min-w-[160px] rounded-xl border bg-white p-4 flex flex-col items-center shadow hover:shadow-md"
    >
      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
        <span className="text-orange-600 font-semibold">{c.name[0]}</span>
      </div>
      <p className="font-medium">{c.name}</p>
      <p className="text-xs text-gray-500">{c.description}</p>
    </button>
  ))}
</div>



  );
}
