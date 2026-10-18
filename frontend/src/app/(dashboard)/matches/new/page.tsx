import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MatchForm } from "@/features/matches/components/MatchForm";
import { PageHeader } from "@/shared/components/common";

export const metadata = {
  title: "Buat Pertandingan Baru | Korfball Hub",
};

export default function NewMatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Pertandingan</span>
        </Link>
      </div>

      <PageHeader
        title="Setup Pertandingan Baru"
        description="Atur tipe pertandingan (scrimmage / official), format K8/K4, tim lawan, dan durasi babak."
      />

      <MatchForm />
    </div>
  );
}
