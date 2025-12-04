import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
  onSelect: (data: {
    place: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function LocationInput({ onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create geocoder instance
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      placeholder: "Search location...",
      mapboxgl: mapboxgl,
      marker: false,
    });

    geocoder.addTo(containerRef.current);
    geocoderRef.current = geocoder;

    geocoder.on("result", (e: any) => {
      const place = e.result.place_name;
      const [lng, lat] = e.result.center;

      onSelect({
        place,
        latitude: lat,
        longitude: lng,
      });
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""; // cleanup
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
