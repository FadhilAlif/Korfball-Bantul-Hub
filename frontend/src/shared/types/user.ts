export interface UserWithRoles {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  is_active: boolean;
  email_verified: boolean;
  roles: string[];
  created_at: string;
}
