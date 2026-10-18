import type { CalculatorEvent, CalculatorMatchInfo, CalculatorPlayer } from "../../box-score.calculator.js";

export const game4MatchInfo: CalculatorMatchInfo = {
  id: 4,
  homeTeamId: 3,
  awayTeamId: 1,
  homeTeamName: "Kab Klaten",
  awayTeamName: "Kab. Bantul",
  homeHeadCoach: "Rizki",
  homeAssistantCoach: "Risang",
  awayHeadCoach: "Rofi",
  awayAssistantCoach: "Felix",
  periodCount: 2,
  periodDurationMinutes: 25,
};

export const game4Players: CalculatorPlayer[] = [
  // Home: Kab Klaten (13 players)
  { id: 301, athleteId: 41, athleteName: "Luthfiya", sex: "FEMALE", jerseyNumber: 2, side: "HOME", isStarter: true },
  { id: 302, athleteId: 42, athleteName: "Ansel", sex: "MALE", jerseyNumber: 4, side: "HOME", isStarter: true },
  { id: 303, athleteId: 43, athleteName: "Salsabila", sex: "FEMALE", jerseyNumber: 5, side: "HOME", isStarter: true },
  { id: 304, athleteId: 44, athleteName: "Bayu", sex: "MALE", jerseyNumber: 6, side: "HOME", isStarter: true },
  { id: 305, athleteId: 45, athleteName: "Carissa", sex: "FEMALE", jerseyNumber: 8, side: "HOME", isStarter: true },
  { id: 306, athleteId: 46, athleteName: "Prastama", sex: "MALE", jerseyNumber: 9, side: "HOME", isStarter: true },
  { id: 307, athleteId: 47, athleteName: "Nugraha", sex: "MALE", jerseyNumber: 10, side: "HOME", isStarter: true },
  { id: 308, athleteId: 48, athleteName: "Petronella", sex: "FEMALE", jerseyNumber: 11, side: "HOME", isStarter: true },
  { id: 309, athleteId: 49, athleteName: "Aziza", sex: "FEMALE", jerseyNumber: 12, side: "HOME", isStarter: false },
  { id: 310, athleteId: 50, athleteName: "Galih", sex: "MALE", jerseyNumber: 15, side: "HOME", isStarter: false },
  { id: 311, athleteId: 51, athleteName: "Kalyca", sex: "FEMALE", jerseyNumber: 17, side: "HOME", isStarter: false },
  { id: 312, athleteId: 52, athleteName: "Fidelya", sex: "FEMALE", jerseyNumber: 19, side: "HOME", isStarter: false },
  { id: 313, athleteId: 53, athleteName: "Elness", sex: "MALE", jerseyNumber: 22, side: "HOME", isStarter: false },

  // Away: Kab. Bantul (19 players)
  { id: 401, athleteId: 1, athleteName: "Rukmi", sex: "FEMALE", jerseyNumber: 1, side: "AWAY", isStarter: false },
  { id: 402, athleteId: 2, athleteName: "Zahra", sex: "FEMALE", jerseyNumber: 2, side: "AWAY", isStarter: false },
  { id: 403, athleteId: 3, athleteName: "Nadia", sex: "FEMALE", jerseyNumber: 3, side: "AWAY", isStarter: false },
  { id: 404, athleteId: 4, athleteName: "Najwa", sex: "FEMALE", jerseyNumber: 4, side: "AWAY", isStarter: false },
  { id: 405, athleteId: 5, athleteName: "Maya", sex: "FEMALE", jerseyNumber: 5, side: "AWAY", isStarter: true },
  { id: 406, athleteId: 6, athleteName: "Sulaiman", sex: "MALE", jerseyNumber: 5, side: "AWAY", isStarter: false },
  { id: 407, athleteId: 7, athleteName: "Ririn", sex: "FEMALE", jerseyNumber: 6, side: "AWAY", isStarter: true },
  { id: 408, athleteId: 8, athleteName: "Lintang", sex: "FEMALE", jerseyNumber: 7, side: "AWAY", isStarter: false },
  { id: 409, athleteId: 9, athleteName: "Dimas", sex: "MALE", jerseyNumber: 8, side: "AWAY", isStarter: true },
  { id: 410, athleteId: 10, athleteName: "Thea", sex: "FEMALE", jerseyNumber: 9, side: "AWAY", isStarter: true },
  { id: 411, athleteId: 11, athleteName: "Zulfan", sex: "MALE", jerseyNumber: 11, side: "AWAY", isStarter: false },
  { id: 412, athleteId: 12, athleteName: "Guntur", sex: "MALE", jerseyNumber: 12, side: "AWAY", isStarter: true },
  { id: 413, athleteId: 13, athleteName: "Viki", sex: "FEMALE", jerseyNumber: 13, side: "AWAY", isStarter: true },
  { id: 414, athleteId: 14, athleteName: "Ramdhan", sex: "MALE", jerseyNumber: 14, side: "AWAY", isStarter: false },
  { id: 415, athleteId: 15, athleteName: "Rakha", sex: "MALE", jerseyNumber: 15, side: "AWAY", isStarter: true },
  { id: 416, athleteId: 16, athleteName: "Bilal", sex: "MALE", jerseyNumber: 16, side: "AWAY", isStarter: false },
  { id: 417, athleteId: 17, athleteName: "Putra", sex: "MALE", jerseyNumber: 17, side: "AWAY", isStarter: true },
  { id: 418, athleteId: 18, athleteName: "Fadhil", sex: "MALE", jerseyNumber: 18, side: "AWAY", isStarter: false },
  { id: 419, athleteId: 19, athleteName: "Wibi", sex: "MALE", jerseyNumber: 18, side: "AWAY", isStarter: false },
];

/**
 * Builds the exact event list to reproduce Game 4 stats from PDF knowledge.
 */
export function buildGame4Events(): CalculatorEvent[] {
  let seq = 1;
  const events: CalculatorEvent[] = [];

  const add = (
    side: "HOME" | "AWAY",
    type: CalculatorEvent["type"],
    matchPlayerId?: number,
    period = 1,
    clockSeconds = 600,
    subInPlayerId?: number,
  ) => {
    events.push({
      id: `g4-ev-${seq}`,
      seq: seq++,
      matchId: 4,
      side,
      type,
      matchPlayerId,
      subInPlayerId,
      period,
      clockSeconds,
    });
  };

  // --- KAB KLATEN (HOME) ---
  // Period 1 Goals (3 goals)
  // Nugraha: 1 SM (made)
  add("HOME", "SHOT_MADE", 307, 1, 1100);
  // Kalyca: 1 SM (made)
  add("HOME", "SHOT_MADE", 311, 1, 800);
  // Kalyca: 1 RIM (made)
  add("HOME", "RUNNING_IN_MADE", 311, 1, 500);

  // Period 2 Goals (1 goal)
  // Kalyca: 1 SM (made)
  add("HOME", "SHOT_MADE", 311, 2, 700);

  // Other stats for Klaten:
  // 4. Bayu: 1 SA missed, 1 RIA missed, 3 OR, 1 AS
  add("HOME", "SHOT_MISSED", 304, 1);
  add("HOME", "RUNNING_IN_MISSED", 304, 1);
  for (let i = 0; i < 3; i++) add("HOME", "REBOUND_OFF", 304, 1);
  add("HOME", "ASSIST", 304, 1);

  // 5. Carissa: 2 F
  for (let i = 0; i < 2; i++) add("HOME", "FOUL", 305, 1);

  // 6. Prastama: 9 SA missed, 1 PA missed, 1 DR, 3 OR, 1 AS, 4 TOV, 2 F
  for (let i = 0; i < 9; i++) add("HOME", "SHOT_MISSED", 306, 1);
  add("HOME", "PENALTY_MISSED", 306, 1);
  add("HOME", "REBOUND_DEF", 306, 1);
  for (let i = 0; i < 3; i++) add("HOME", "REBOUND_OFF", 306, 1);
  add("HOME", "ASSIST", 306, 1);
  for (let i = 0; i < 4; i++) add("HOME", "TURNOVER", 306, 1);
  for (let i = 0; i < 2; i++) add("HOME", "FOUL", 306, 1);

  // 7. Nugraha: 1 SA missed (1 made = 2 total), 6 DR, 1 OR, 1 TOV, 1 F
  add("HOME", "SHOT_MISSED", 307, 1);
  for (let i = 0; i < 6; i++) add("HOME", "REBOUND_DEF", 307, 1);
  add("HOME", "REBOUND_OFF", 307, 1);
  add("HOME", "TURNOVER", 307, 1);
  add("HOME", "FOUL", 307, 1);

  // 8. Petronella: 1 F
  add("HOME", "FOUL", 308, 1);

  // 9. Aziza: 1 SA missed
  add("HOME", "SHOT_MISSED", 309, 1);

  // 10. Galih: 4 SA missed, 1 RIA missed, 6 DR, 1 OR, 4 TOV
  for (let i = 0; i < 4; i++) add("HOME", "SHOT_MISSED", 310, 2);
  add("HOME", "RUNNING_IN_MISSED", 310, 2);
  for (let i = 0; i < 6; i++) add("HOME", "REBOUND_DEF", 310, 2);
  add("HOME", "REBOUND_OFF", 310, 2);
  for (let i = 0; i < 4; i++) add("HOME", "TURNOVER", 310, 2);

  // 11. Kalyca: 2 SA missed (2 made = 4 total), 1 RIA missed (1 made = 2 total), 1 DR, 1 OR, 2 D, 2 TOV
  for (let i = 0; i < 2; i++) add("HOME", "SHOT_MISSED", 311, 2);
  add("HOME", "RUNNING_IN_MISSED", 311, 2);
  add("HOME", "REBOUND_DEF", 311, 2);
  add("HOME", "REBOUND_OFF", 311, 2);
  for (let i = 0; i < 2; i++) add("HOME", "DECK", 311, 2);
  for (let i = 0; i < 2; i++) add("HOME", "TURNOVER", 311, 2);

  // 12. Fidelya: 2 SA missed, 1 RIA missed, 2 DR, 1 OR, 2 TOV
  for (let i = 0; i < 2; i++) add("HOME", "SHOT_MISSED", 312, 2);
  add("HOME", "RUNNING_IN_MISSED", 312, 2);
  for (let i = 0; i < 2; i++) add("HOME", "REBOUND_DEF", 312, 2);
  add("HOME", "REBOUND_OFF", 312, 2);
  for (let i = 0; i < 2; i++) add("HOME", "TURNOVER", 312, 2);

  // --- KAB. BANTUL (AWAY) ---
  // Period 1 Goals (3 goals)
  // Ririn: 1 RIM (made)
  add("AWAY", "RUNNING_IN_MADE", 407, 1, 1000);
  // Dimas: 1 SM (made)
  add("AWAY", "SHOT_MADE", 409, 1, 750);
  // Thea: 1 RIM (made)
  add("AWAY", "RUNNING_IN_MADE", 410, 1, 400);

  // Period 2 Goals (2 goals)
  // Guntur: 1 SM (made)
  add("AWAY", "SHOT_MADE", 412, 2, 850);
  // Guntur: 1 SM (made)
  add("AWAY", "SHOT_MADE", 412, 2, 450);

  // Other stats for Bantul:
  // 1. Rukmi: 1 DR
  add("AWAY", "REBOUND_DEF", 401, 1);

  // 5. Maya: 12 SA missed, 1 RIA missed, 3 OR
  for (let i = 0; i < 12; i++) add("AWAY", "SHOT_MISSED", 405, 1);
  add("AWAY", "RUNNING_IN_MISSED", 405, 1);
  for (let i = 0; i < 3; i++) add("AWAY", "REBOUND_OFF", 405, 1);

  // 6. Sulaiman: 1 DR
  add("AWAY", "REBOUND_DEF", 406, 1);

  // 7. Ririn: 2 SA missed, 1 RIA missed (1 made = 2 total), 1 PA missed, 1 DR, 1 OR, 1 AS
  for (let i = 0; i < 2; i++) add("AWAY", "SHOT_MISSED", 407, 1);
  add("AWAY", "RUNNING_IN_MISSED", 407, 1);
  add("AWAY", "PENALTY_MISSED", 407, 1);
  add("AWAY", "REBOUND_DEF", 407, 1);
  add("AWAY", "REBOUND_OFF", 407, 1);
  add("AWAY", "ASSIST", 407, 1);

  // 9. Dimas: 4 SA missed (1 made = 5 total), 2 OR
  for (let i = 0; i < 4; i++) add("AWAY", "SHOT_MISSED", 409, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_OFF", 409, 1);

  // 10. Thea: 2 SA missed, 1 PA missed, 4 OR, 1 IT, 1 TOV, 1 F
  for (let i = 0; i < 2; i++) add("AWAY", "SHOT_MISSED", 410, 1);
  add("AWAY", "PENALTY_MISSED", 410, 1);
  for (let i = 0; i < 4; i++) add("AWAY", "REBOUND_OFF", 410, 1);
  add("AWAY", "INTERCEPT", 410, 1);
  add("AWAY", "TURNOVER", 410, 1);
  add("AWAY", "FOUL", 410, 1);

  // 12. Guntur: 8 SA missed (2 made = 10 total), 1 PA missed, 2 DR, 6 OR, 1 D, 1 F
  for (let i = 0; i < 8; i++) add("AWAY", "SHOT_MISSED", 412, 2);
  add("AWAY", "PENALTY_MISSED", 412, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_DEF", 412, 2);
  for (let i = 0; i < 6; i++) add("AWAY", "REBOUND_OFF", 412, 2);
  add("AWAY", "DECK", 412, 2);
  add("AWAY", "FOUL", 412, 2);

  // 13. Viki: 8 SA missed, 2 OR, 1 D, 2 TOV
  for (let i = 0; i < 8; i++) add("AWAY", "SHOT_MISSED", 413, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_OFF", 413, 1);
  add("AWAY", "DECK", 413, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "TURNOVER", 413, 1);

  // 15. Rakha: 3 SA missed, 1 PA missed, 4 DR, 4 OR, 1 AS, 1 IT, 2 TOV, 4 F
  for (let i = 0; i < 3; i++) add("AWAY", "SHOT_MISSED", 415, 2);
  add("AWAY", "PENALTY_MISSED", 415, 2);
  for (let i = 0; i < 4; i++) add("AWAY", "REBOUND_DEF", 415, 2);
  for (let i = 0; i < 4; i++) add("AWAY", "REBOUND_OFF", 415, 2);
  add("AWAY", "ASSIST", 415, 2);
  add("AWAY", "INTERCEPT", 415, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "TURNOVER", 415, 2);
  for (let i = 0; i < 4; i++) add("AWAY", "FOUL", 415, 2);

  // 17. Putra: 3 SA missed, 2 DR, 4 OR, 1 TOV, 2 F
  for (let i = 0; i < 3; i++) add("AWAY", "SHOT_MISSED", 417, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_DEF", 417, 2);
  for (let i = 0; i < 4; i++) add("AWAY", "REBOUND_OFF", 417, 2);
  add("AWAY", "TURNOVER", 417, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "FOUL", 417, 2);

  // 18. Fadhil: 4 SA missed, 2 DR, 4 OR, 2 AS, 1 IT, 1 F
  for (let i = 0; i < 4; i++) add("AWAY", "SHOT_MISSED", 418, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_DEF", 418, 2);
  for (let i = 0; i < 4; i++) add("AWAY", "REBOUND_OFF", 418, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "ASSIST", 418, 2);
  add("AWAY", "INTERCEPT", 418, 2);
  add("AWAY", "FOUL", 418, 2);

  // --- SUBSTITUTIONS FROM PDF LOG ---
  // 1. B1 04:56 Bantul — keluar #13 Viki, masuk #1 Rukmi
  add("AWAY", "SUBSTITUTION", 413, 1, 296, 401);

  // 2. B2 05:34 Klaten — keluar #6 Bayu, masuk #22 Elness
  add("HOME", "SUBSTITUTION", 304, 2, 334, 313);

  // 3. B2 03:33 Klaten — keluar #10 Nugraha, masuk #6 Bayu
  add("HOME", "SUBSTITUTION", 307, 2, 213, 304);

  return events;
}
