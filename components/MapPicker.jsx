"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { GoogleMap, MarkerF, CircleF, useJsApiLoader } from "@react-google-maps/api";

export default function MapPicker({ value, onChange, onAddress, height = 320 }) {
  const defaultCenter = useMemo(() => ({ lat: 41.7151, lng: 44.8271 }), []); // Tbilisi
  const center = useMemo(() => ({
    lat: value?.lat ?? defaultCenter.lat,
    lng: value?.lng ?? defaultCenter.lng
  }), [value, defaultCenter]);
  const [isLocating, setIsLocating] = useState(false);
  const [map, setMap] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);
  const watchUpdatesRef = useRef(0);

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
    // Clear previous accuracy if user manually chose a point
    if (!Array.isArray(event)) setAccuracy(null);
    reverseGeocode(lat, lng);
  }, [onChange, reverseGeocode]);

  function stopWatching() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    watchUpdatesRef.current = 0;
  }

  useEffect(() => () => stopWatching(), []);

  function locateUser() {
    if (!navigator?.geolocation) return;
    setIsLocating(true);
    stopWatching();
    const desiredAccuracyMeters = 60;
    const maxUpdates = 5;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        watchUpdatesRef.current += 1;
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setAccuracy(acc ?? null);
        handleClick([latitude, longitude]);
        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          if (acc && acc < 120) map.setZoom(16);
          if (acc && acc < 60) map.setZoom(17);
        }
        if ((acc && acc <= desiredAccuracyMeters) || watchUpdatesRef.current >= maxUpdates) {
          stopWatching();
          setIsLocating(false);
        }
      },
      () => {
        stopWatching();
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
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
          {value?.lat && value?.lng && accuracy ? (
            <CircleF
              center={{ lat: value.lat, lng: value.lng }}
              radius={Math.max(accuracy, 15)}
              options={{
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
                strokeColor: "#3b82f6",
                strokeOpacity: 0.6,
                strokeWeight: 1
              }}
            />
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

