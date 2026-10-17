export type AthleteSex = "MALE" | "FEMALE";
export type AthleteStatus = "ACTIVE" | "INACTIVE";

export interface AthleteItem {
  id: number;
  teamId: number;
  teamName: string;
  teamShortName: string | null;
  teamIsInternal: boolean;
  userId: number | null;
  userEmail: string | null;
  fullName: string;
  nickname: string | null;
  sex: AthleteSex;
  jerseyNumber: number | null;
  birthDate: string | null;
  status: AthleteStatus;
  notes: string | null;
  attendance30dRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AthleteFilterState {
  teamId: string;
  sex: string;
  status: string;
}
