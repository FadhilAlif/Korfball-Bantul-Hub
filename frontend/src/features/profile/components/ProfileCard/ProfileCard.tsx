"use client";

import { Pencil } from "lucide-react";
import { memo } from "react";
import { Avatar, Badge, Button } from "@/shared/components/ui";

interface ProfileCardProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  onEditProfile: () => void;
}

export const ProfileCard = memo(function ProfileCard({ name, email, avatarUrl, onEditProfile }: ProfileCardProps) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card shadow-sm">
      <Avatar name={name} src={avatarUrl} size={64} className="ring-2 ring-primary/20 shadow-xs" />

      <div className="flex-1 min-w-0">
        <h2 className="text-[17px] font-semibold tracking-tight truncate">{name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground truncate">{email}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <Badge variant="success" dot>
            Active
          </Badge>
        </div>
      </div>

      <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onEditProfile}>
        <Pencil size={13} />
        Edit profile
      </Button>
    </div>
  );
});
