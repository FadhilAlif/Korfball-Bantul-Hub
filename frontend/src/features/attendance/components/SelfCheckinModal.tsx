"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, LocateFixed, MapPin, Navigation } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSessions } from "@/features/sessions/hooks";
import type { SessionItem } from "@/features/sessions/types";
import { Alert, Badge, Button, FormField, Input, Modal } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { type SelfCheckinResponse, useSelfCheckin } from "../hooks";
import {
  estimateDistanceMetersUi,
  type SelfCheckinFormInput,
  type SelfCheckinFormOutput,
  selfCheckinFormSchema,
} from "../schemas/attendance.schema";

interface SelfCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: SessionItem | null;
}

type CheckinTab = "gps" | "code";

export function SelfCheckinModal({ isOpen, onClose, session: propSession }: SelfCheckinModalProps) {
  const [checkinResult, setCheckinResult] = useState<SelfCheckinResponse | null>(null);
  const [activeTab, setActiveTab] = useState<CheckinTab>("gps");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const selfCheckin = useSelfCheckin();
  const { data: sessionsData } = useSessions({
    page: 1,
    limit: 5,
    status: "SCHEDULED",
  });

  // Resolve target scheduled session (prefer propSession, else nearest upcoming/active scheduled session)
  const scheduledSessions = sessionsData?.data ?? [];
  const nearestSession =
    propSession ??
    [...scheduledSessions].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ??
    null;

  const hasSessionGps =
    nearestSession &&
    nearestSession.latitude !== null &&
    nearestSession.latitude !== undefined &&
    nearestSession.longitude !== null &&
    nearestSession.longitude !== undefined;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<SelfCheckinFormInput, unknown, SelfCheckinFormOutput>({
    resolver: zodResolver(selfCheckinFormSchema),
    defaultValues: { code: "" },
  });

  const codeValue = watch("code") ?? "";

  const requestDeviceLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError("Perangkat/browser Anda tidak mendukung Geolocation. Gunakan tab Kode 6 Digit.");
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        setIsLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Akses lokasi ditolak browser. Izinkan GPS atau beralih ke tab Kode 6 Digit."
            : "Sinyal GPS lemah atau timeout. Silakan coba lagi atau gunakan Kode 6 Digit.";
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCheckinResult(null);
      setGpsError(null);
      reset({ code: "" });
      if (hasSessionGps) {
        setActiveTab("gps");
        requestDeviceLocation();
      } else {
        setActiveTab("code");
      }
    }
  }, [isOpen, reset, hasSessionGps, requestDeviceLocation]);

  const estimatedDistance =
    hasSessionGps && userCoords && nearestSession.latitude !== null && nearestSession.longitude !== null
      ? estimateDistanceMetersUi(userCoords.lat, userCoords.lng, nearestSession.latitude, nearestSession.longitude)
      : null;

  const allowedRadius = nearestSession?.radiusMeters ?? 100;
  const isInsideRadius = estimatedDistance !== null && estimatedDistance <= allowedRadius;

  const handleGpsCheckin = () => {
    if (!nearestSession || !userCoords) {
      requestDeviceLocation();
      return;
    }

    setGpsError(null);
    selfCheckin.mutate(
      {
        sessionId: nearestSession.id,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
      },
      {
        onSuccess: (res) => {
          setCheckinResult(res);
          toast.success("Check-in GPS berhasil!", { description: res.message });
        },
        onError: (err) => {
          setGpsError(getErrorMessage(err));
        },
      },
    );
  };

  const onSubmitCode = (data: SelfCheckinFormOutput) => {
    selfCheckin.mutate(
      { code: data.code },
      {
        onSuccess: (res) => {
          setCheckinResult(res);
          toast.success("Check-in berhasil!", { description: res.message });
        },
        onError: (err) => {
          setError("root", { message: getErrorMessage(err) });
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Check-In Kehadiran Mandiri" maxWidth="sm">
      {checkinResult ? (
        <div className="flex flex-col items-center text-center gap-4 py-3">
          <div className="w-14 h-14 rounded-2xl bg-success/15 text-success flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>

          <div className="space-y-1">
            <div className="text-base font-semibold">{checkinResult.sessionTitle}</div>
            <p className="text-xs text-muted-foreground">{checkinResult.message}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant={checkinResult.status === "PRESENT" ? "success" : "warning"} dot>
              {checkinResult.status === "PRESENT" ? "HADIR TEPAT WAKTU" : "HADIR TERLAMBAT"}
            </Badge>
            {checkinResult.distanceMeters !== null && checkinResult.distanceMeters !== undefined && (
              <Badge variant="info">GPS · {checkinResult.distanceMeters}m</Badge>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {new Intl.DateTimeFormat("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Jakarta",
              }).format(new Date(checkinResult.checkedInAt))}{" "}
              WIB
            </span>
          </div>

          <Button type="button" fullWidth onClick={onClose} className="mt-2">
            Selesai
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-1">
          {/* Tab Switcher: Lokasi GPS vs Kode 6 Digit */}
          <div
            role="tablist"
            aria-label="Metode Check-In"
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted border border-border"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "gps"}
              onClick={() => setActiveTab("gps")}
              className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "gps"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Navigation size={14} className={activeTab === "gps" ? "text-primary" : ""} />
              <span>Lokasi GPS (1-Tap)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "code"}
              onClick={() => setActiveTab("code")}
              className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound size={14} className={activeTab === "code" ? "text-primary" : ""} />
              <span>Kode 6 Digit</span>
            </button>
          </div>

          {activeTab === "gps" ? (
            <div role="tabpanel" className="flex flex-col gap-3.5">
              {nearestSession && hasSessionGps ? (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider">Sesi Aktif</div>
                        <div className="text-sm font-semibold mt-0.5">{nearestSession.title}</div>
                      </div>
                      <Badge variant="info">Radius {allowedRadius}m</Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span>{nearestSession.venue || "WIFA SPORT CENTER"}</span>
                    </div>
                  </div>

                  {/* Live Distance Indicator */}
                  <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Status Jarak GPS Anda</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={requestDeviceLocation}
                        isLoading={isLocating}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <LocateFixed size={12} />
                        Perbarui Lokasi
                      </Button>
                    </div>

                    {isLocating ? (
                      <div className="text-xs text-muted-foreground py-1">Mendeteksi titik GPS perangkat Anda…</div>
                    ) : userCoords && estimatedDistance !== null ? (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div>
                          <div className="text-lg font-bold font-mono">
                            ±{estimatedDistance} meter{" "}
                            <span className="text-xs font-normal text-muted-foreground">dari titik latihan</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Akurasi GPS perangkat: ±{userCoords.accuracy}m
                          </div>
                        </div>
                        <Badge variant={isInsideRadius ? "success" : "danger"} dot>
                          {isInsideRadius ? "Dalam Radius" : "Di Luar Radius"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground py-1">
                        Klik tombol <strong>Perbarui Lokasi</strong> untuk memeriksa jarak Anda ke lapangan.
                      </div>
                    )}
                  </div>

                  {gpsError && <Alert message={gpsError} />}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Batal
                    </Button>
                    <Button
                      type="button"
                      isLoading={selfCheckin.isPending}
                      disabled={!userCoords || isLocating}
                      onClick={handleGpsCheckin}
                      className="gap-1.5"
                    >
                      <Navigation size={14} />
                      Check-In di Lokasi Sekarang
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center space-y-2.5">
                  <div className="text-sm font-semibold">Titik GPS Sesi Belum Tersedia</div>
                  <p className="text-xs text-muted-foreground">
                    Sesi latihan ini belum memiliki titik koordinat GPS atau belum ada sesi terjadwal. Silakan gunakan{" "}
                    <strong>Kode 6 Digit</strong> dari Pelatih/Official.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("code")}>
                    Beralih ke Kode 6 Digit
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form role="tabpanel" onSubmit={handleSubmit(onSubmitCode)} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground -mt-0.5">
                Masukkan 6 karakter kode sesi latihan yang ditampilkan oleh Pelatih / Official di lapangan.
              </p>

              {errors.root && <Alert message={errors.root.message ?? "Gagal melakukan check-in"} />}

              <FormField
                label="Kode Sesi (6 Karakter)"
                htmlFor="checkin-code-input"
                required
                error={errors.code?.message}
              >
                <Input
                  id="checkin-code-input"
                  {...register("code")}
                  value={codeValue}
                  onChange={(e) =>
                    setValue(
                      "code",
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                      {
                        shouldValidate: false,
                      },
                    )
                  }
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="CONTOH: K7M4X9"
                  iconLeft={<KeyRound size={16} />}
                  height="lg"
                  className="font-mono text-center text-xl font-bold tracking-[0.25em] uppercase"
                  error={errors.code?.message}
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" isLoading={selfCheckin.isPending} disabled={codeValue.length !== 6}>
                  Kirim Check-In
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
