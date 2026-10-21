"use client";

import "leaflet/dist/leaflet.css";
import { Compass, ExternalLink, LocateFixed, MapPin, MapPinOff, Radar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Input } from "@/shared/components/ui";
import { toast } from "@/shared/lib/toast";
import { DEFAULT_VENUE_PRESET, VENUE_PRESETS, type VenuePreset } from "../types";

const RADIUS_PRESETS = [50, 100, 150, 250];

interface SessionLocationPickerProps {
  venue: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  onChangeVenue?: (venue: string) => void;
  onChangeCoordinates: (coords: { latitude: number | null; longitude: number | null }) => void;
  onChangeRadius: (radiusMeters: number) => void;
  errorMessage?: string;
}

export function SessionLocationPicker({
  venue,
  latitude,
  longitude,
  radiusMeters,
  onChangeVenue,
  onChangeCoordinates,
  onChangeRadius,
  errorMessage,
}: SessionLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const circleRef = useRef<import("leaflet").Circle | null>(null);
  const onChangeCoordsRef = useRef(onChangeCoordinates);
  onChangeCoordsRef.current = onChangeCoordinates;

  const [isLocating, setIsLocating] = useState(false);

  const hasCoordinates = latitude !== null && longitude !== null;
  const activeLat = latitude ?? DEFAULT_VENUE_PRESET.latitude;
  const activeLng = longitude ?? DEFAULT_VENUE_PRESET.longitude;
  const safeRadius = Number.isFinite(radiusMeters) && radiusMeters >= 20 ? radiusMeters : 100;

  useEffect(() => {
    if (!hasCoordinates || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
      return;
    }

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [activeLat, activeLng],
          zoom: 17,
          scrollWheelZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: "korfball-venue-pin",
          html: `<div style="width:28px;height:28px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:9999px;background:#ffffff;"></div></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([activeLat, activeLng], {
          draggable: true,
          icon: pinIcon,
        }).addTo(map);

        const circle = L.circle([activeLat, activeLng], {
          radius: safeRadius,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.18,
          weight: 2,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeCoordsRef.current({
            latitude: Number(pos.lat.toFixed(7)),
            longitude: Number(pos.lng.toFixed(7)),
          });
        });

        map.on("click", (ev: import("leaflet").LeafletMouseEvent) => {
          onChangeCoordsRef.current({
            latitude: Number(ev.latlng.lat.toFixed(7)),
            longitude: Number(ev.latlng.lng.toFixed(7)),
          });
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;

        setTimeout(() => {
          map.invalidateSize();
        }, 120);

        if (mapContainerRef.current && typeof ResizeObserver !== "undefined") {
          const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
          });
          resizeObserver.observe(mapContainerRef.current);
        }
      } else {
        markerRef.current?.setLatLng([activeLat, activeLng]);
        circleRef.current?.setLatLng([activeLat, activeLng]);
        circleRef.current?.setRadius(safeRadius);
        mapInstanceRef.current.panTo([activeLat, activeLng], { animate: true });
        mapInstanceRef.current.invalidateSize();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hasCoordinates, activeLat, activeLng, safeRadius]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleSelectPreset = (preset: VenuePreset) => {
    onChangeVenue?.(preset.venue);
    onChangeCoordinates({
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
    onChangeRadius(preset.radiusMeters);
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(7));
        const lng = Number(pos.coords.longitude.toFixed(7));
        onChangeCoordinates({ latitude: lat, longitude: lng });
        toast.success("Titik lokasi GPS berhasil diambil", {
          description: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      },
      (err) => {
        setIsLocating(false);
        toast.error("Gagal mengambil lokasi GPS", {
          description:
            err.code === err.PERMISSION_DENIED
              ? "Izin akses lokasi ditolak di browser Anda."
              : "Pastikan GPS aktif dan coba lagi.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleClearGps = () => {
    onChangeCoordinates({ latitude: null, longitude: null });
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Radar size={15} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Titik Lokasi GPS & Radius Check-In (Geofence)</span>
          {hasCoordinates ? (
            <Badge variant="info" dot>
              GPS Aktif ({safeRadius}m)
            </Badge>
          ) : (
            <Badge variant="outline">Hanya Kode 6 Digit</Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isLocating}
            onClick={handleUseCurrentLocation}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <LocateFixed size={12} />
            Lokasi Saya Saat Ini
          </Button>
          {hasCoordinates && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearGps}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <MapPinOff size={12} />
              Tanpa GPS
            </Button>
          )}
        </div>
      </div>

      {/* Preset Lokasi Latihan */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">Preset Lokasi Latihan:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {VENUE_PRESETS.map((preset) => {
            const isSelected =
              hasCoordinates &&
              Math.abs((latitude ?? 0) - preset.latitude) < 0.0002 &&
              Math.abs((longitude ?? 0) - preset.longitude) < 0.0002;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <MapPin size={12} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                {preset.label}
              </button>
            );
          })}
          {DEFAULT_VENUE_PRESET.mapsUrl && (
            <a
              href={DEFAULT_VENUE_PRESET.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline ml-auto"
            >
              <ExternalLink size={11} />
              Buka WIFA Sport Center di Maps
            </a>
          )}
        </div>
      </div>

      {hasCoordinates ? (
        <>
          {/* Interactive Leaflet Map */}
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted h-40 sm:h-44 w-full z-0">
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono">
              <Compass size={12} className="text-primary" />
              Koordinat: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
            </span>
            <span>Klik pada peta atau geser pin biru untuk menyesuaikan titik lokasi</span>
          </div>

          {/* Radius Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center pt-1 border-t border-border/70">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground">Radius Maksimal Check-In (Meter)</span>
              <div className="flex items-center gap-1.5">
                {RADIUS_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChangeRadius(r)}
                    className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                      safeRadius === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={20}
                max={2000}
                value={radiusMeters}
                onChange={(e) => onChangeRadius(Number(e.target.value) || 100)}
                aria-label="Radius Check-In (Meter)"
              />
              <span className="text-xs text-muted-foreground shrink-0">meter (20–2000m)</span>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-3 text-xs text-muted-foreground flex items-center justify-between gap-2">
          <span>
            Titik lokasi GPS dinonaktifkan. Atlet hanya dapat check-in menggunakan <strong>Kode 6 Karakter</strong>.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSelectPreset(DEFAULT_VENUE_PRESET)}
            className="h-7 text-xs shrink-0"
          >
            Aktifkan WIFA Sport Center
          </Button>
        </div>
      )}

      {errorMessage && <p className="text-xs text-destructive font-medium">{errorMessage}</p>}
    </div>
  );
}
