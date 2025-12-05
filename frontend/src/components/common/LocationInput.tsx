import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { X } from "lucide-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
  value?: string;
  onSelect: (data: {
    place: string;
    latitude: number;
    longitude: number;
  }) => void;
  onClear?: () => void;
}

export default function LocationInput({ value, onSelect, onClear }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const geocoderRef = useRef<any>(null);
  const [hasValue, setHasValue] = useState(!!value);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      placeholder: value || "Search location...",
      mapboxgl,
      marker: false,
      countries: "IN",
    });

    geocoderRef.current = geocoder;
    geocoder.addTo(containerRef.current);

    // If value provided
    if (value) geocoder.setInput(value);

    geocoder.on("result", (e: any) => {
      const place = e.result.place_name;
      const [lng, lat] = e.result.center;

      setHasValue(true);

      onSelect({
        place,
        latitude: lat,
        longitude: lng,
      });
    });

    geocoder.on("clear", () => {
      setHasValue(false);
      if (onClear) onClear();
    });

    // Style Mapbox
    setTimeout(() => {
      const root = containerRef.current?.querySelector(".mapboxgl-ctrl-geocoder") as HTMLElement;
      if (!root) return;

      root.style.width = "100%";
      root.style.height = "40px";
      root.style.border = "1px solid #D1D5DB";
      root.style.borderRadius = "0.5rem";
      root.style.boxShadow = "none";
      root.style.background = "white";
      root.style.paddingRight = "32px";
      root.style.position = "relative";

      const input = root.querySelector("input") as HTMLInputElement;
      if (input) {
        input.style.height = "40px";
        input.style.padding = "0 12px";
        input.style.fontSize = "0.875rem";
        input.style.border = "none";
      }

      // Hide icons
      root.querySelectorAll("svg, .mapboxgl-ctrl-geocoder--icon").forEach((el: any) => {
        el.style.display = "none";
      });
    }, 80);

  }, []);

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="w-full" />

      {hasValue && (
        <button
          onClick={() => {
            geocoderRef.current?.clear();
            setHasValue(false);
            if (onClear) onClear();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
