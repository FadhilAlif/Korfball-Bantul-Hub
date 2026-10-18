import type { CalculatorEvent, CalculatorMatchInfo, CalculatorPlayer } from "../../box-score.calculator.js";

export const game2MatchInfo: CalculatorMatchInfo = {
  id: 1,
  homeTeamId: 1,
  awayTeamId: 2,
  homeTeamName: "Kab. Bantul",
  awayTeamName: "Tangerang Selatan",
  homeHeadCoach: "Rofi",
  homeAssistantCoach: "Felix",
  awayHeadCoach: "Dadang",
  awayAssistantCoach: "-",
  periodCount: 2,
  periodDurationMinutes: 25,
};

export const game2Players: CalculatorPlayer[] = [
  // Home: Kab. Bantul (19 players)
  { id: 101, athleteId: 1, athleteName: "Rukmi", sex: "FEMALE", jerseyNumber: 1, side: "HOME", isStarter: true },
  { id: 102, athleteId: 2, athleteName: "Zahra", sex: "FEMALE", jerseyNumber: 2, side: "HOME", isStarter: true },
  { id: 103, athleteId: 3, athleteName: "Nadia", sex: "FEMALE", jerseyNumber: 3, side: "HOME", isStarter: true },
  { id: 104, athleteId: 4, athleteName: "Najwa", sex: "FEMALE", jerseyNumber: 4, side: "HOME", isStarter: true },
  { id: 105, athleteId: 5, athleteName: "Maya", sex: "FEMALE", jerseyNumber: 5, side: "HOME", isStarter: false },
  { id: 106, athleteId: 6, athleteName: "Sulaiman", sex: "MALE", jerseyNumber: 5, side: "HOME", isStarter: false },
  { id: 107, athleteId: 7, athleteName: "Ririn", sex: "FEMALE", jerseyNumber: 6, side: "HOME", isStarter: false },
  { id: 108, athleteId: 8, athleteName: "Lintang", sex: "FEMALE", jerseyNumber: 7, side: "HOME", isStarter: false },
  { id: 109, athleteId: 9, athleteName: "Dimas", sex: "MALE", jerseyNumber: 8, side: "HOME", isStarter: true },
  { id: 110, athleteId: 10, athleteName: "Thea", sex: "FEMALE", jerseyNumber: 9, side: "HOME", isStarter: false },
  { id: 111, athleteId: 11, athleteName: "Zulfan", sex: "MALE", jerseyNumber: 11, side: "HOME", isStarter: false },
  { id: 112, athleteId: 12, athleteName: "Guntur", sex: "MALE", jerseyNumber: 12, side: "HOME", isStarter: true },
  { id: 113, athleteId: 13, athleteName: "Viki", sex: "FEMALE", jerseyNumber: 13, side: "HOME", isStarter: false },
  { id: 114, athleteId: 14, athleteName: "Ramdhan", sex: "MALE", jerseyNumber: 14, side: "HOME", isStarter: false },
  { id: 115, athleteId: 15, athleteName: "Rakha", sex: "MALE", jerseyNumber: 15, side: "HOME", isStarter: true },
  { id: 116, athleteId: 16, athleteName: "Bilal", sex: "MALE", jerseyNumber: 16, side: "HOME", isStarter: false },
  { id: 117, athleteId: 17, athleteName: "Putra", sex: "MALE", jerseyNumber: 17, side: "HOME", isStarter: true },
  { id: 118, athleteId: 18, athleteName: "Fadhil", sex: "MALE", jerseyNumber: 18, side: "HOME", isStarter: false },
  { id: 119, athleteId: 19, athleteName: "Wibi", sex: "MALE", jerseyNumber: 18, side: "HOME", isStarter: false },

  // Away: Tangerang Selatan (17 players)
  { id: 201, athleteId: 21, athleteName: "Sisyl", sex: "FEMALE", jerseyNumber: 0, side: "AWAY", isStarter: true },
  { id: 202, athleteId: 22, athleteName: "Zahra", sex: "FEMALE", jerseyNumber: 2, side: "AWAY", isStarter: true },
  { id: 203, athleteId: 23, athleteName: "Maisaw", sex: "MALE", jerseyNumber: 5, side: "AWAY", isStarter: true },
  { id: 204, athleteId: 24, athleteName: "Tama", sex: "MALE", jerseyNumber: 7, side: "AWAY", isStarter: true },
  { id: 205, athleteId: 25, athleteName: "Yara", sex: "FEMALE", jerseyNumber: 7, side: "AWAY", isStarter: true },
  { id: 206, athleteId: 26, athleteName: "Fevy", sex: "FEMALE", jerseyNumber: 7, side: "AWAY", isStarter: true },
  { id: 207, athleteId: 27, athleteName: "Fatur", sex: "MALE", jerseyNumber: 9, side: "AWAY", isStarter: true },
  { id: 208, athleteId: 28, athleteName: "Franky", sex: "MALE", jerseyNumber: 11, side: "AWAY", isStarter: true },
  { id: 209, athleteId: 29, athleteName: "Ibam", sex: "MALE", jerseyNumber: 16, side: "AWAY", isStarter: false },
  { id: 210, athleteId: 30, athleteName: "Aboy", sex: "MALE", jerseyNumber: 17, side: "AWAY", isStarter: false },
  { id: 211, athleteId: 31, athleteName: "Riky", sex: "MALE", jerseyNumber: 19, side: "AWAY", isStarter: false },
  { id: 212, athleteId: 32, athleteName: "Orsan", sex: "FEMALE", jerseyNumber: 19, side: "AWAY", isStarter: false },
  { id: 213, athleteId: 33, athleteName: "Nabila", sex: "FEMALE", jerseyNumber: 25, side: "AWAY", isStarter: false },
  { id: 214, athleteId: 34, athleteName: "Alya", sex: "FEMALE", jerseyNumber: 26, side: "AWAY", isStarter: false },
  { id: 215, athleteId: 35, athleteName: "Hani", sex: "FEMALE", jerseyNumber: 28, side: "AWAY", isStarter: false },
  { id: 216, athleteId: 36, athleteName: "Shofi", sex: "FEMALE", jerseyNumber: 31, side: "AWAY", isStarter: false },
  { id: 217, athleteId: 37, athleteName: "Oman", sex: "MALE", jerseyNumber: 47, side: "AWAY", isStarter: false },
];

/**
 * Builds the exact event list to reproduce Game 2 stats from PDF.
 */
export function buildGame2Events(): CalculatorEvent[] {
  let seq = 1;
  const events: CalculatorEvent[] = [];

  const add = (
    side: "HOME" | "AWAY",
    type: CalculatorEvent["type"],
    matchPlayerId?: number,
    period = 1,
    clockSeconds = 600,
  ) => {
    events.push({
      id: `g2-ev-${seq}`,
      seq: seq++,
      matchId: 1,
      side,
      type,
      matchPlayerId,
      period,
      clockSeconds,
    });
  };

  // --- KAB. BANTUL (HOME) ---
  // Period 1 Goals (4 goals)
  // Rukmi: 1 SM (made)
  add("HOME", "SHOT_MADE", 101, 1, 1200);
  // Rukmi: 1 PM (made)
  add("HOME", "PENALTY_MADE", 101, 1, 900);
  // Zahra: 1 PM (made)
  add("HOME", "PENALTY_MADE", 102, 1, 600);
  // Nadia: 1 RIM (made)
  add("HOME", "RUNNING_IN_MADE", 103, 1, 300);

  // Period 2 Goals (4 goals)
  // Dimas: 1 SM (made)
  add("HOME", "SHOT_MADE", 109, 2, 1200);
  // Guntur: 1 RIM (made)
  add("HOME", "RUNNING_IN_MADE", 112, 2, 900);
  // Viki: 1 PM (made)
  add("HOME", "PENALTY_MADE", 113, 2, 600);
  // Wibi: 1 RIM (made)
  add("HOME", "RUNNING_IN_MADE", 119, 2, 300);

  // Missed Attempts & other stats for Bantul:
  // 1. Rukmi: 1 SA missed, 1 RIA missed, 1 PA missed, 3 DR, 2 IT, 1 TOV, 1 F
  add("HOME", "SHOT_MISSED", 101, 1);
  add("HOME", "RUNNING_IN_MISSED", 101, 1);
  add("HOME", "PENALTY_MISSED", 101, 1);
  for (let i = 0; i < 3; i++) add("HOME", "REBOUND_DEF", 101, 1);
  for (let i = 0; i < 2; i++) add("HOME", "INTERCEPT", 101, 1);
  add("HOME", "TURNOVER", 101, 1);
  add("HOME", "FOUL", 101, 1);

  // 2. Zahra: 1 SA missed, 1 IT
  add("HOME", "SHOT_MISSED", 102, 1);
  add("HOME", "INTERCEPT", 102, 1);

  // 3. Nadia: 3 SA missed
  for (let i = 0; i < 3; i++) add("HOME", "SHOT_MISSED", 103, 1);

  // 4. Najwa: 1 SA missed, 1 TOV, 1 F
  add("HOME", "SHOT_MISSED", 104, 1);
  add("HOME", "TURNOVER", 104, 1);
  add("HOME", "FOUL", 104, 1);

  // 5. Maya: 1 SA missed, 2 OR, 1 AS, 3 IT
  add("HOME", "SHOT_MISSED", 105, 1);
  for (let i = 0; i < 2; i++) add("HOME", "REBOUND_OFF", 105, 1);
  add("HOME", "ASSIST", 105, 1);
  for (let i = 0; i < 3; i++) add("HOME", "INTERCEPT", 105, 1);

  // 6. Sulaiman: all 0

  // 7. Ririn: 2 SA missed, 1 TOV
  for (let i = 0; i < 2; i++) add("HOME", "SHOT_MISSED", 107, 1);
  add("HOME", "TURNOVER", 107, 1);

  // 8. Lintang: 2 SA missed, 3 RIA missed, 2 PA missed, 1 TOV
  for (let i = 0; i < 2; i++) add("HOME", "SHOT_MISSED", 108, 1);
  for (let i = 0; i < 3; i++) add("HOME", "RUNNING_IN_MISSED", 108, 1);
  for (let i = 0; i < 2; i++) add("HOME", "PENALTY_MISSED", 108, 1);
  add("HOME", "TURNOVER", 108, 1);

  // 9. Dimas: 2 SA missed (1 made = 3 total), 1 DR, 2 OR, 1 IT, 2 TOV
  for (let i = 0; i < 2; i++) add("HOME", "SHOT_MISSED", 109, 2);
  add("HOME", "REBOUND_DEF", 109, 2);
  for (let i = 0; i < 2; i++) add("HOME", "REBOUND_OFF", 109, 2);
  add("HOME", "INTERCEPT", 109, 2);
  for (let i = 0; i < 2; i++) add("HOME", "TURNOVER", 109, 2);

  // 10. Thea: 1 DR, 1 OR, 3 IT
  add("HOME", "REBOUND_DEF", 110, 2);
  add("HOME", "REBOUND_OFF", 110, 2);
  for (let i = 0; i < 3; i++) add("HOME", "INTERCEPT", 110, 2);

  // 11. Zulfan: all 0

  // 12. Guntur: 4 SA missed, 1 RIA missed (1 made = 2 total), 1 DR, 1 OR, 1 D, 1 AS
  for (let i = 0; i < 4; i++) add("HOME", "SHOT_MISSED", 112, 2);
  add("HOME", "RUNNING_IN_MISSED", 112, 2);
  add("HOME", "REBOUND_DEF", 112, 2);
  add("HOME", "REBOUND_OFF", 112, 2);
  add("HOME", "DECK", 112, 2);
  add("HOME", "ASSIST", 112, 2);

  // 13. Viki: 1 SA missed, 1 AS, 1 IT
  add("HOME", "SHOT_MISSED", 113, 2);
  add("HOME", "ASSIST", 113, 2);
  add("HOME", "INTERCEPT", 113, 2);

  // 14. Ramdhan: 1 OR, 1 IT
  add("HOME", "REBOUND_OFF", 114, 2);
  add("HOME", "INTERCEPT", 114, 2);

  // 15. Rakha: 3 SA missed, 3 OR, 1 AS
  for (let i = 0; i < 3; i++) add("HOME", "SHOT_MISSED", 115, 2);
  for (let i = 0; i < 3; i++) add("HOME", "REBOUND_OFF", 115, 2);
  add("HOME", "ASSIST", 115, 2);

  // 16. Bilal: all 0

  // 17. Putra: 1 SA missed, 1 OR
  add("HOME", "SHOT_MISSED", 117, 2);
  add("HOME", "REBOUND_OFF", 117, 2);

  // 18. Fadhil: 1 DR
  add("HOME", "REBOUND_DEF", 118, 2);

  // 19. Wibi: 1 SA missed (1 RIM made)
  add("HOME", "SHOT_MISSED", 119, 2);

  // --- TANGERANG SELATAN (AWAY) ---
  // Period 1 Goals (3 goals)
  // Fevy: 1 SM (made)
  add("AWAY", "SHOT_MADE", 206, 1, 1100);
  // Fatur: 1 SM (made)
  add("AWAY", "SHOT_MADE", 207, 1, 800);
  // Alya: 1 PM (made)
  add("AWAY", "PENALTY_MADE", 214, 1, 400);

  // Period 2 Goals (0 goals)

  // Missed Attempts & other stats for Tangsel:
  // 1. Sisyl: all 0
  // 2. Zahra: 2 F
  for (let i = 0; i < 2; i++) add("AWAY", "FOUL", 202, 1);

  // 3. Maisaw: 3 SA missed, 1 DR, 2 TOV, 1 F
  for (let i = 0; i < 3; i++) add("AWAY", "SHOT_MISSED", 203, 1);
  add("AWAY", "REBOUND_DEF", 203, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "TURNOVER", 203, 1);
  add("AWAY", "FOUL", 203, 1);

  // 4. Tama: 3 SA missed, 1 DR, 1 IT
  for (let i = 0; i < 3; i++) add("AWAY", "SHOT_MISSED", 204, 1);
  add("AWAY", "REBOUND_DEF", 204, 1);
  add("AWAY", "INTERCEPT", 204, 1);

  // 5. Yara: 1 SA missed, 1 F
  add("AWAY", "SHOT_MISSED", 205, 1);
  add("AWAY", "FOUL", 205, 1);

  // 6. Fevy: 1 RIA missed, 1 PA missed, 1 IT, 2 TOV
  add("AWAY", "RUNNING_IN_MISSED", 206, 1);
  add("AWAY", "PENALTY_MISSED", 206, 1);
  add("AWAY", "INTERCEPT", 206, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "TURNOVER", 206, 1);

  // 7. Fatur: 1 F
  add("AWAY", "FOUL", 207, 1);

  // 8. Franky: 1 SA missed, 2 DR, 2 IT, 3 TOV
  add("AWAY", "SHOT_MISSED", 208, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_DEF", 208, 1);
  for (let i = 0; i < 2; i++) add("AWAY", "INTERCEPT", 208, 1);
  for (let i = 0; i < 3; i++) add("AWAY", "TURNOVER", 208, 1);

  // 9. Ibam: 1 DR, 1 OR
  add("AWAY", "REBOUND_DEF", 209, 2);
  add("AWAY", "REBOUND_OFF", 209, 2);

  // 10. Aboy: 1 SA missed, 1 DR, 3 TOV
  add("AWAY", "SHOT_MISSED", 210, 2);
  add("AWAY", "REBOUND_DEF", 210, 2);
  for (let i = 0; i < 3; i++) add("AWAY", "TURNOVER", 210, 2);

  // 11. Riky: 3 DR, 2 TOV, 1 F
  for (let i = 0; i < 3; i++) add("AWAY", "REBOUND_DEF", 211, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "TURNOVER", 211, 2);
  add("AWAY", "FOUL", 211, 2);

  // 12. Orsan: 1 IT, 1 F
  add("AWAY", "INTERCEPT", 212, 2);
  add("AWAY", "FOUL", 212, 2);

  // 13. Nabila: 1 SA missed, 1 RIA missed, 1 TOV
  add("AWAY", "SHOT_MISSED", 213, 2);
  add("AWAY", "RUNNING_IN_MISSED", 213, 2);
  add("AWAY", "TURNOVER", 213, 2);

  // 14. Alya: 1 RIA missed, 2 OR, 1 IT, 1 TOV
  add("AWAY", "RUNNING_IN_MISSED", 214, 2);
  for (let i = 0; i < 2; i++) add("AWAY", "REBOUND_OFF", 214, 2);
  add("AWAY", "INTERCEPT", 214, 2);
  add("AWAY", "TURNOVER", 214, 2);

  // 15. Hani: 1 DR, 1 TOV
  add("AWAY", "REBOUND_DEF", 215, 2);
  add("AWAY", "TURNOVER", 215, 2);

  // 16. Shofi: all 0

  // 17. Oman: 1 RIA missed, 3 TOV
  add("AWAY", "RUNNING_IN_MISSED", 217, 2);
  for (let i = 0; i < 3; i++) add("AWAY", "TURNOVER", 217, 2);

  // Team turnover for Tangsel
  add("AWAY", "TEAM_TURNOVER", undefined, 2);

  return events;
}
