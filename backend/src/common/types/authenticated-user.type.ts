import type { Sex } from "../../database/schema/index.js";

export interface LinkedAthleteProfile {
  id: number;
  fullName: string;
  nickname: string | null;
  teamId: number;
  jerseyNumber: number | null;
  sex: Sex;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
  fullName?: string;
  roles: string[];
  permissions: string[];
  athlete?: LinkedAthleteProfile | null;
}
