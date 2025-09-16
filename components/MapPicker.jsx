"use client";

import { useCallback, useMemo, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

export default function MapPicker({ value, onChange, onAddress, height = 320 }) {
  const defaultCenter = useMemo(() => ({ lat: 41.7151, lng: 44.8271 }), []); // Tbilisi
  const center = useMemo(() => ({
    lat: value?.lat ?? defaultCenter.lat,
    lng: value?.lng ?? defaultCenter.lng
  }), [value, defaultCenter]);
  const [isLocating, setIsLocating] = useState(false);
  const [map, setMap] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      // Prefer Google Geocoder if available
      if (window?.google?.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({ location: { lat, lng } });
        const label = res?.results?.[0]?.formatted_address || "";
        if (label) {
          onAddress?.(label);
          return;
        }
      }
      // Fallback to Nominatim if Google geocoder unavailable/no results
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const d = await r.json();
      const label = d?.display_name || "";
      onAddress?.(label);
    } catch (err) {
      // silently ignore geocoding errors
    }
  }, [onAddress]);

  const handleClick = useCallback((event) => {
    let lat, lng;
    if (event?.latLng) {
      lat = event.latLng.lat();
      lng = event.latLng.lng();
    } else if (Array.isArray(event)) {
      lat = event[0];
      lng = event[1];
    } else if (event?.lat && event?.lng) {
      lat = event.lat;
      lng = event.lng;
    } else {
      return;
    }
    const next = { lat, lng };
    onChange?.(next);
    reverseGeocode(lat, lng);
  }, [onChange, reverseGeocode]);

  function locateUser() {
    if (!navigator?.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleClick([latitude, longitude]);
        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(15);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div style={{ height }} className="w-full rounded overflow-hidden border border-black/10 relative">
      <button
        type="button"
        onClick={locateUser}
        disabled={isLocating}
        className="absolute top-2 left-2 z-10 btn-secondary px-3 py-1.5 rounded-lg text-sm bg-white/90"
      >
        {isLocating ? "Locating..." : "Use my location"}
      </button>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={13}
          onClick={handleClick}
          onLoad={(m) => {
            setMap(m);
          }}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
            clickableIcons: false
          }}
        >
          {value?.lat && value?.lng ? (
            <MarkerF position={{ lat: value.lat, lng: value.lng }} />
          ) : null}
        </GoogleMap>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
          Loading map...
        </div>
      )}
    </div>
  );
}

