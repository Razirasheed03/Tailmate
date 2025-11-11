// // src/pages/user/PetPickerForListing.tsx
// import * as React from 'react';
// import { listMyPets } from '@/services/petsApiService';

// type Pet = {
//   _id: string;
//   name: string;
//   photoUrl?: string;
//   status?: 'available' | 'listed' | 'sold' | 'adopted';
// };

// export function PetPickerForListing({
//   onPick,
// }: {
//   onPick: (pet: Pet) => void;
// }) {
//   const [items, setItems] = React.useState<Pet[]>([]);
//   const [loading, setLoading] = React.useState(true);
//   const [err, setErr] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await listMyPets(1, 50);
//         const pets: Pet[] = res?.data ?? res ?? [];
//         const eligible = pets.filter((p) => (p.status ?? 'available') === 'available');
//         setItems(eligible);
//       } catch (e: any) {
//         setErr(e?.message || 'Failed to load pets');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   if (loading) return <p className="text-sm text-gray-600">Loading pets…</p>;
//   if (err) return <p className="text-sm text-rose-600">{err}</p>;
//   if (items.length === 0) return <p className="text-sm text-gray-600">No eligible pets</p>;

//   return (
//     <div className="flex gap-4 overflow-x-auto pb-2">
//       {items.map((p) => (
//         <button
//           key={p._id}
//           onClick={() => onPick(p)}
//           className="min-w-[180px] rounded-xl border bg-white p-3 flex items-center gap-3 shadow hover:shadow-md"
//           type="button"
//         >
//           {p.photoUrl ? (
//             <img src={p.photoUrl} className="w-12 h-12 rounded-full object-cover border" />
//           ) : (
//             <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
//               {p.name[0]}
//             </div>
//           )}
//           <div className="text-left">
//             <p className="font-medium">{p.name}</p>
//             <p className="text-xs text-gray-500">{p._id}</p>
//           </div>
//         </button>
//       ))}
//     </div>
//   );
// }
