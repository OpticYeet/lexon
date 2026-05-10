import { daysBetween } from "@/lib/utils";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  gracePeriodUsed: boolean;
  totalPapersRead: number;
  totalDaysActive: number;
}

export interface StreakUpdateResult {
  newState: StreakState;
  streakIncremented: boolean;
  streakBroken: boolean;
  milestoneReached: number | null; // streak number if a milestone was hit
}

const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export function checkAndUpdateStreak(
  currentState: StreakState,
  today: string, // YYYY-MM-DD in user's timezone
  todayReadCount: number,
  dailyGoal: number
): StreakUpdateResult {
  // Goal not yet met today
  if (todayReadCount < dailyGoal) {
    return {
      newState: currentState,
      streakIncremented: false,
      streakBroken: false,
      milestoneReached: null,
    };
  }

  // Already counted today
  if (currentState.lastActiveDate === today) {
    return {
      newState: {
        ...currentState,
        totalPapersRead: currentState.totalPapersRead + 1,
      },
      streakIncremented: false,
      streakBroken: false,
      milestoneReached: null,
    };
  }

  let newStreak: number;
  let gracePeriodUsed = currentState.gracePeriodUsed;
  let streakBroken = false;

  if (!currentState.lastActiveDate) {
    // First ever day
    newStreak = 1;
    gracePeriodUsed = false;
  } else {
    const gap = daysBetween(currentState.lastActiveDate, today);

    if (gap === 1) {
      // Consecutive day
      newStreak = currentState.currentStreak + 1;
      gracePeriodUsed = false;
    } else if (gap === 2 && !currentState.gracePeriodUsed) {
      // Missed one day — use grace period
      newStreak = currentState.currentStreak + 1;
      gracePeriodUsed = true;
    } else {
      // Streak broken
      newStreak = 1;
      gracePeriodUsed = false;
      streakBroken = true;
    }
  }

  const longestStreak = Math.max(currentState.longestStreak, newStreak);
  const milestoneReached = MILESTONES.includes(newStreak) ? newStreak : null;

  const newState: StreakState = {
    currentStreak: newStreak,
    longestStreak,
    lastActiveDate: today,
    gracePeriodUsed,
    totalPapersRead: currentState.totalPapersRead + 1,
    totalDaysActive: currentState.totalDaysActive + 1,
  };

  return {
    newState,
    streakIncremented: true,
    streakBroken,
    milestoneReached,
  };
}

export function getStreakColor(streak: number): string {
  if (streak === 0) return "var(--streak-cold)";
  if (streak < 7) return "var(--streak-warm)";
  if (streak < 30) return "var(--streak-hot)";
  return "var(--streak-fire)";
}

export function getStreakLabel(streak: number): string {
  if (streak === 0) return "Start your streak!";
  if (streak === 1) return "1 day";
  return `${streak} days`;
}
