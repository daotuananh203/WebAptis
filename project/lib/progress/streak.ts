/**
 * Daily Learning Streak Calculator
 * Timezone-safe, pure functions to compute consecutive learning streaks and active study days.
 */

import { DailyStreakSummary, ProgressAttemptRecord } from "./types";

/**
 * Format a Date object to "YYYY-MM-DD" in UTC/calendar format.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a Date object safely in UTC.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Compute the absolute difference in calendar days between two "YYYY-MM-DD" dates.
 */
export function differenceInCalendarDays(
  dateStrA: string,
  dateStrB: string
): number {
  const [y1, m1, d1] = dateStrA.split("-").map(Number);
  const [y2, m2, d2] = dateStrB.split("-").map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc1 - utc2) / MS_PER_DAY);
}

/**
 * Calculate streak summary from attempt history against an explicit reference date.
 */
export function calculateDailyStreak(
  history: ProgressAttemptRecord[],
  referenceDate: Date = new Date()
): DailyStreakSummary {
  if (history.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastActiveDate: null,
      totalActiveDays: 0,
    };
  }

  // Extract unique active dates (sorted ascending)
  const dateSet = new Set<string>();
  for (const record of history) {
    const recordDate = new Date(record.completedAt);
    if (!isNaN(recordDate.getTime())) {
      dateSet.add(formatDateToYYYYMMDD(recordDate));
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastActiveDate: null,
      totalActiveDays: 0,
    };
  }

  const todayStr = formatDateToYYYYMMDD(referenceDate);
  const yesterdayStr = formatDateToYYYYMMDD(addDays(referenceDate, -1));
  const isActiveToday = dateSet.has(todayStr);
  const lastActiveDate = sortedDates[sortedDates.length - 1];

  // 1. Calculate longest streak across history
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = differenceInCalendarDays(sortedDates[i], sortedDates[i - 1]);
    if (diff === 1) {
      currentRun += 1;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  // 2. Calculate current streak up to today or yesterday
  let currentStreak = 0;
  if (isActiveToday) {
    currentStreak = 1;
    let checkDate = addDays(referenceDate, -1);
    while (dateSet.has(formatDateToYYYYMMDD(checkDate))) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  } else if (dateSet.has(yesterdayStr)) {
    // If not active today, but active yesterday, streak is alive
    currentStreak = 1;
    let checkDate = addDays(referenceDate, -2);
    while (dateSet.has(formatDateToYYYYMMDD(checkDate))) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  } else {
    // Missed both today and yesterday -> streak broken
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    isActiveToday,
    lastActiveDate,
    totalActiveDays: sortedDates.length,
  };
}
