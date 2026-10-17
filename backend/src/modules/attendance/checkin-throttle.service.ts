import { Injectable } from "@nestjs/common";

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class CheckinThrottleService {
  private readonly attempts = new Map<number, AttemptRecord>();

  /**
   * Records a failed check-in attempt for a given user.
   * Returns the new failure count within the 10-minute window.
   */
  recordFailedAttempt(userId: number): number {
    const now = Date.now();
    const existing = this.attempts.get(userId);

    if (!existing || now - existing.firstAttemptAt > WINDOW_MS) {
      this.attempts.set(userId, { count: 1, firstAttemptAt: now });
      return 1;
    }

    existing.count += 1;
    return existing.count;
  }

  /**
   * Checks whether the user is currently blocked due to reaching 5 failed attempts in 10 minutes.
   */
  isBlocked(userId: number): boolean {
    const now = Date.now();
    const existing = this.attempts.get(userId);

    if (!existing) return false;

    if (now - existing.firstAttemptAt > WINDOW_MS) {
      this.attempts.delete(userId);
      return false;
    }

    return existing.count >= MAX_ATTEMPTS;
  }

  /**
   * Resets the failed attempts counter on a successful check-in.
   */
  reset(userId: number): void {
    this.attempts.delete(userId);
  }
}
