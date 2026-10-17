"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Badge, Button, FormField, Input, Modal } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { type SelfCheckinResponse, useSelfCheckin } from "../hooks";
import {
  type SelfCheckinFormInput,
  type SelfCheckinFormOutput,
  selfCheckinFormSchema,
} from "../schemas/attendance.schema";

interface SelfCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SelfCheckinModal({ isOpen, onClose }: SelfCheckinModalProps) {
  const [checkinResult, setCheckinResult] = useState<SelfCheckinResponse | null>(null);
  const selfCheckin = useSelfCheckin();

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

  useEffect(() => {
    if (isOpen) {
      setCheckinResult(null);
      reset({ code: "" });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: SelfCheckinFormOutput) => {
    selfCheckin.mutate(data.code, {
      onSuccess: (res) => {
        setCheckinResult(res);
        toast.success("Check-in berhasil!", { description: res.message });
      },
      onError: (err) => {
        setError("root", { message: getErrorMessage(err) });
      },
    });
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

          <div className="flex items-center gap-2">
            <Badge variant={checkinResult.status === "PRESENT" ? "success" : "warning"} dot>
              {checkinResult.status === "PRESENT" ? "HADIR TEPAT WAKTU" : "HADIR TERLAMBAT"}
            </Badge>
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          <p className="text-sm text-muted-foreground -mt-0.5">
            Masukkan 6 karakter kode sesi latihan yang ditampilkan oleh Pelatih / Official di lapangan.
          </p>

          {errors.root && <Alert message={errors.root.message ?? "Gagal melakukan check-in"} />}

          <FormField label="Kode Sesi (6 Karakter)" htmlFor="checkin-code-input" required error={errors.code?.message}>
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
    </Modal>
  );
}
