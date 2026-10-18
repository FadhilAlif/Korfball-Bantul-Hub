import { EditMatchPage } from "@/features/matches/components/EditMatchPage";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);

  return <EditMatchPage matchId={matchId} />;
}
