"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useMapEvents } from "react-leaflet";

const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, {
  ssr: false
});
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false
});
// useMapEvents is a hook; import directly instead of dynamic

export default function MapPicker({ value, onChange, onAddress, height = 320 }) {
  const [L, setL] = useState(null);

  useEffect(() => {
    import("leaflet").then((mod) => setL(mod));
  }, []);

  const position = useMemo(() => {
    return value?.lat && value?.lng ? [value.lat, value.lng] : [41.7151, 44.8271]; // Tbilisi
  }, [value]);

  const icon = useMemo(() => {
    if (!L) return null;
    const iconUrl = require("leaflet/dist/images/marker-icon.png");
    const iconRetinaUrl = require("leaflet/dist/images/marker-icon-2x.png");
    const shadowUrl = require("leaflet/dist/images/marker-shadow.png");
    return new L.Icon({
      iconUrl: iconUrl.default || iconUrl,
      iconRetinaUrl: iconRetinaUrl.default || iconRetinaUrl,
      shadowUrl: shadowUrl.default || shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }, [L]);

  function MapEvents() {
    const Handler = useMapEvents({
      click(e) {
        const next = { lat: e.latlng.lat, lng: e.latlng.lng };
        onChange?.(next);
        // Reverse geocode using Nominatim (no key) to auto-fill address
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${next.lat}&lon=${next.lng}`)
          .then((r) => r.json())
          .then((d) => {
            const label = d?.display_name || "";
            onAddress?.(label);
          })
          .catch(() => {});
      }
    });
    return null;
  }

  return (
    <div style={{ height }} className="w-full rounded overflow-hidden border border-black/10">
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {value?.lat && value?.lng && icon ? (
          <Marker position={[value.lat, value.lng]} icon={icon} />
        ) : null}
        <MapEvents />
      </MapContainer>
    </div>
  );
}


