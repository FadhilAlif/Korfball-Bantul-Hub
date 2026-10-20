import { EditMatchPage } from "@/features/matches/components/EditMatchPage";
import { ProtectedRoute } from "@/shared/components/guard";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return (
    <ProtectedRoute requiredPermission="matches:update">
      <EditMatchPage matchId={matchId} />
    </ProtectedRoute>
  );
}
