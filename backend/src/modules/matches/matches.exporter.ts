import { type TableSheet, buildWorkbook } from "../../lib/exporters/table-workbook.js";
import { toWibParts } from "../sessions/sessions.utils.js";
import type { MatchBoxScore, TeamBoxScore } from "./box-score.calculator.js";

function teamRows(team: TeamBoxScore): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  let no = 1;

  for (const p of team.players) {
    rows.push([
      no++,
      p.athleteName,
      p.sexLabel,
      p.jerseyNumber,
      p.sm,
      p.sa,
      p.pctFgsFormatted,
      p.rim,
      p.ria,
      p.pctFgrFormatted,
      p.pm,
      p.pa,
      p.pctPFormatted,
      p.dr,
      p.or,
      p.tot,
      p.d,
      p.as,
      p.it,
      p.tov,
      0, // TOVT is on team row
      p.f,
      p.yc,
      p.rc,
      p.eff,
    ]);
  }

  // Team total row
  rows.push([
    "TOTAL",
    team.teamName,
    "-",
    "-",
    team.sm,
    team.sa,
    team.pctFgsFormatted,
    team.rim,
    team.ria,
    team.pctFgrFormatted,
    team.pm,
    team.pa,
    team.pctPFormatted,
    team.dr,
    team.or,
    team.tot,
    team.d,
    team.as,
    team.it,
    team.tov,
    team.tovt,
    team.f,
    team.yc,
    team.rc,
    team.eff,
  ]);

  return rows;
}

const BOX_SCORE_COLUMNS = [
  "No",
  "Nama",
  "Sex",
  "Num",
  "SM",
  "SA",
  "%FGS",
  "RIM",
  "RIA",
  "%FGR",
  "PM",
  "PA",
  "%P",
  "DR",
  "OR",
  "TOT",
  "D",
  "AS",
  "IT",
  "TOV",
  "TOVT",
  "F",
  "YC",
  "RC",
  "EFF",
];

function getUniqueSheetName(usedNames: Set<string>, desiredName: string): string {
  const cleaned =
    desiredName
      .replace(/[:\\/?*[\]]/g, "_")
      .slice(0, 31)
      .trim() || "Sheet";
  let uniqueName = cleaned;
  let counter = 1;
  while (usedNames.has(uniqueName.toLowerCase())) {
    const suffix = ` (${counter})`;
    uniqueName = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
    counter++;
  }
  usedNames.add(uniqueName.toLowerCase());
  return uniqueName;
}

export async function buildMatchReportWorkbook(
  boxScore: MatchBoxScore,
  matchHeader: {
    competition?: string | null;
    gameNumber?: string | null;
    scheduledAt: Date | string;
    venue?: string | null;
    juryChair?: string | null;
    juryMembers?: string | null;
    referees?: string | null;
    homeLabel?: string | null;
    awayLabel?: string | null;
  },
): Promise<Buffer> {
  const tables: TableSheet[] = [];
  const usedSheetNames = new Set<string>();

  // Sheet 1: Ringkasan
  const wib = toWibParts(new Date(matchHeader.scheduledAt));
  const wibDateStr = `${wib.year}-${String(wib.month).padStart(2, "0")}-${String(wib.day).padStart(2, "0")}`;

  tables.push({
    sheetName: getUniqueSheetName(usedSheetNames, "Ringkasan"),
    tableName: "RingkasanMatch",
    columns: ["Parameter", "Nilai"],
    rows: [
      ["Kompetisi", matchHeader.competition ?? "-"],
      ["Nomor Game", matchHeader.gameNumber ?? "-"],
      ["Tanggal Pertandingan", wibDateStr],
      ["Venue / Lokasi", matchHeader.venue ?? "-"],
      ["Tim Home", boxScore.home.teamName],
      ["Tim Away", boxScore.away.teamName],
      ["Skor Akhir", `${boxScore.homeScore} - ${boxScore.awayScore}`],
      ["Jury Chair", matchHeader.juryChair ?? "-"],
      ["Jury Members", matchHeader.juryMembers ?? "-"],
      ["Referee(s)", matchHeader.referees ?? "-"],
      ["Head Coach Home", boxScore.home.coach ?? "-"],
      ["Head Coach Away", boxScore.away.coach ?? "-"],
    ],
  });

  // Sheet 2: Home Box Score
  const homeSheetName = getUniqueSheetName(usedSheetNames, `Home - ${boxScore.home.teamName || "Home"}`);
  tables.push({
    sheetName: homeSheetName,
    tableName: "BoxScoreHome",
    columns: BOX_SCORE_COLUMNS,
    rows: teamRows(boxScore.home),
  });

  // Sheet 3: Away Box Score
  const awaySheetName = getUniqueSheetName(usedSheetNames, `Away - ${boxScore.away.teamName || "Away"}`);
  tables.push({
    sheetName: awaySheetName,
    tableName: "BoxScoreAway",
    columns: BOX_SCORE_COLUMNS,
    rows: teamRows(boxScore.away),
  });

  // Sheet 4: Period Scores
  const periodCols = ["Tim", ...boxScore.periods.map((p) => p.periodLabel), "Total"];
  const homePeriodRow = [boxScore.home.teamName, ...boxScore.periods.map((p) => p.home), boxScore.homeScore];
  const awayPeriodRow = [boxScore.away.teamName, ...boxScore.periods.map((p) => p.away), boxScore.awayScore];

  tables.push({
    sheetName: getUniqueSheetName(usedSheetNames, "Skor Babak"),
    tableName: "SkorPerBabak",
    columns: periodCols,
    rows: [homePeriodRow, awayPeriodRow],
  });

  // Sheet 5: Running Score
  tables.push({
    sheetName: getUniqueSheetName(usedSheetNames, "Running Score"),
    tableName: "RunningScoreTable",
    columns: ["Babak", "Waktu", "Sisi", "No", "Pemain", "Aksi", "Home", "Away"],
    rows: boxScore.runningScore.map((r) => [
      r.periodLabel,
      r.clockFormatted,
      r.side,
      r.jerseyNumber ?? "-",
      r.athleteName,
      r.actionLabel,
      r.homeScore,
      r.awayScore,
    ]),
  });

  // Sheet 6: Log Substitusi & Timeout
  tables.push({
    sheetName: getUniqueSheetName(usedSheetNames, "Log Sub & Timeout"),
    tableName: "SubTimeoutLog",
    columns: ["Babak", "Waktu", "Sisi", "Tipe", "Keterangan"],
    rows: boxScore.logs.map((l) => [l.periodLabel, l.clockFormatted, l.side, l.type, l.description]),
  });

  return buildWorkbook(tables);
}
