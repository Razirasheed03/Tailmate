// FAB.tsx
export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add Listing"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 active:scale-95 transition flex items-center justify-center"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
      </svg>
    </button>
  );
}
