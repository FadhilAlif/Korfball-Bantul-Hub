"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, FormField, Input, Modal } from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useSubmitExcuse } from "../hooks";
import { type ExcuseFormInput, type ExcuseFormOutput, excuseFormSchema } from "../schemas/attendance.schema";

interface ExcuseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  sessionTitle: string;
}

export function ExcuseRequestModal({ isOpen, onClose, sessionId, sessionTitle }: ExcuseRequestModalProps) {
  const submitExcuse = useSubmitExcuse();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExcuseFormInput, unknown, ExcuseFormOutput>({
    resolver: zodResolver(excuseFormSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ reason: "" });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: ExcuseFormOutput) => {
    submitExcuse.mutate(
      { sessionId, reason: data.reason },
      {
        onSuccess: () => {
          toast.success("Izin berhasil diajukan", { description: sessionTitle });
          onClose();
        },
        onError: (err) => {
          setError("root", { message: getErrorMessage(err) });
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ajukan Izin — ${sessionTitle}`} maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 pt-1">
        <p className="text-sm text-muted-foreground -mt-0.5">
          Pengajuan izin mandiri hanya dapat dikirim sebelum jadwal sesi dimulai. Tuliskan alasan izin dengan jelas
          (5–250 karakter).
        </p>

        {errors.root && <Alert message={errors.root.message ?? "Gagal mengirim izin"} />}

        <FormField label="Alasan Izin / Berhalangan" htmlFor="excuse-reason" required error={errors.reason?.message}>
          <Input
            id="excuse-reason"
            {...register("reason")}
            placeholder="Contoh: Ujian praktikum kampus / pemulihan cedera engkel"
            error={errors.reason?.message}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={submitExcuse.isPending}>
            Kirim Pengajuan Izin
          </Button>
        </div>
      </form>
    </Modal>
  );
}
