export interface TeamItem {
  id: number;
  name: string;
  shortName: string | null;
  isInternal: boolean;
  region: string | null;
  color: string;
  activeAthletesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamFilterState {
  isInternal: string;
}
