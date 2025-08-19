// components/common/ComingSoon.tsx
import { Hammer } from "lucide-react";

export default function ComingSoon({ title = "Coming Soon", description = "This section is under development." }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md w-full">
        <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
          <Hammer className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
