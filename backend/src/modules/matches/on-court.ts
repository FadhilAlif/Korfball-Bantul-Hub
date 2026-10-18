import type { MatchSide } from "../../database/schema/enums.js";
import type { CalculatorEvent, CalculatorPlayer } from "./box-score.calculator.js";

export interface SideCourtState {
  side: MatchSide;
  onCourtPlayerIds: number[];
  benchPlayerIds: number[];
  redCardPlayerIds: number[];
}

export interface MatchCourtState {
  home: SideCourtState;
  away: SideCourtState;
}

/**
 * Computes current on-court, bench, and red-carded players for each side.
 * Derived from starting lineup + chronological SUBSTITUTION and RED_CARD events.
 */
export function getCourtState(players: CalculatorPlayer[], events: CalculatorEvent[]): MatchCourtState {
  const homeOnCourt = new Set<number>();
  const homeBench = new Set<number>();
  const homeRedCards = new Set<number>();

  const awayOnCourt = new Set<number>();
  const awayBench = new Set<number>();
  const awayRedCards = new Set<number>();

  // 1. Initial state from starters
  for (const p of players) {
    if (p.side === "HOME") {
      if (p.isStarter) {
        homeOnCourt.add(p.id);
      } else {
        homeBench.add(p.id);
      }
    } else {
      if (p.isStarter) {
        awayOnCourt.add(p.id);
      } else {
        awayBench.add(p.id);
      }
    }
  }

  // 2. Process non-deleted events sorted by sequence
  const activeEvents = events.filter((e) => !e.deletedAt).sort((a, b) => a.seq - b.seq);

  for (const event of activeEvents) {
    const onCourt = event.side === "HOME" ? homeOnCourt : awayOnCourt;
    const bench = event.side === "HOME" ? homeBench : awayBench;
    const redCards = event.side === "HOME" ? homeRedCards : awayRedCards;

    if (event.type === "SUBSTITUTION") {
      const outId = event.matchPlayerId;
      const inId = event.subInPlayerId;

      if (outId && inId) {
        // Only perform substitution if outId is not red-carded
        if (onCourt.has(outId)) {
          onCourt.delete(outId);
          bench.add(outId);
        }
        if (bench.has(inId) && !redCards.has(inId)) {
          bench.delete(inId);
          onCourt.add(inId);
        }
      }
    } else if (event.type === "RED_CARD") {
      const targetId = event.matchPlayerId;
      if (targetId) {
        redCards.add(targetId);
        onCourt.delete(targetId);
        bench.delete(targetId);
      }
    }
  }

  return {
    home: {
      side: "HOME",
      onCourtPlayerIds: Array.from(homeOnCourt),
      benchPlayerIds: Array.from(homeBench),
      redCardPlayerIds: Array.from(homeRedCards),
    },
    away: {
      side: "AWAY",
      onCourtPlayerIds: Array.from(awayOnCourt),
      benchPlayerIds: Array.from(awayBench),
      redCardPlayerIds: Array.from(awayRedCards),
    },
  };
}

/**
 * Validates substitution according to BR-22:
 * Player going out must currently be on-court.
 * Player going in must currently be on the bench.
 * Neither player can have a red card.
 */
export function validateSubstitution(
  sideState: SideCourtState,
  outPlayerId: number,
  inPlayerId: number,
): { valid: boolean; error?: string } {
  if (outPlayerId === inPlayerId) {
    return { valid: false, error: "Pemain keluar dan pemain masuk tidak boleh sama." };
  }

  if (sideState.redCardPlayerIds.includes(outPlayerId) || sideState.redCardPlayerIds.includes(inPlayerId)) {
    return { valid: false, error: "Pemain yang telah menerima kartu merah tidak dapat disubstitusi." };
  }

  if (!sideState.onCourtPlayerIds.includes(outPlayerId)) {
    return { valid: false, error: "Pemain yang keluar harus sedang berada di lapangan." };
  }

  if (!sideState.benchPlayerIds.includes(inPlayerId)) {
    return { valid: false, error: "Pemain yang masuk harus sedang berada di bangku cadangan (bench)." };
  }

  return { valid: true };
}

/**
 * Validates player eligibility according to BR-23:
 * A player who received a RED_CARD cannot receive new events.
 */
export function isPlayerEligibleForEvent(
  sideState: SideCourtState,
  playerId: number,
): { valid: boolean; eligible: boolean; error?: string } {
  if (sideState.redCardPlayerIds.includes(playerId)) {
    return { valid: false, eligible: false, error: "Pemain telah dikeluarkan dari pertandingan (kartu merah)." };
  }
  return { valid: true, eligible: true };
}
