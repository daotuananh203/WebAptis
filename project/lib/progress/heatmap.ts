/**
 * 12-Week Heatmap Grid Data Generator
 * Prepares aggregated daily activity and intensity data for user engagement heatmaps.
 */

import { addDays, formatDateToYYYYMMDD } from "./streak";
import { HeatmapDayData, HeatmapIntensity, ProgressAttemptRecord, TwelveWeekHeatmapSummary } from "./types";

/**
 * Determine heatmap intensity level based on activity count and study minutes.
 */
export function calculateHeatmapIntensity(
  activityCount: number,
  totalMinutes: number
): HeatmapIntensity {
  if (activityCount === 0) return 0;
  if (activityCount === 1 || totalMinutes < 15) return 1;
  if (activityCount <= 3 || totalMinutes < 35) return 2;
  if (activityCount <= 5 || totalMinutes < 60) return 3;
  return 4;
}

/**
 * Generate 12-week (84 calendar days) heatmap data grid from learning history.
 */
export function generateTwelveWeekHeatmap(
  history: ProgressAttemptRecord[],
  referenceEndDate: Date = new Date()
): TwelveWeekHeatmapSummary {
  const TOTAL_DAYS = 84; // 12 weeks * 7 days
  const endDateStr = formatDateToYYYYMMDD(referenceEndDate);
  const startDate = addDays(referenceEndDate, -(TOTAL_DAYS - 1));
  const startDateStr = formatDateToYYYYMMDD(startDate);

  // Group attempts by date
  const dayMap = new Map<string, ProgressAttemptRecord[]>();
  for (const record of history) {
    const recordDate = new Date(record.completedAt);
    if (!isNaN(recordDate.getTime())) {
      const dateKey = formatDateToYYYYMMDD(recordDate);
      const existing = dayMap.get(dateKey) || [];
      existing.push(record);
      dayMap.set(dateKey, existing);
    }
  }

  const days: HeatmapDayData[] = [];
  let totalActivities = 0;
  let totalStudyMinutes = 0;

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const currentDay = addDays(startDate, i);
    const dateKey = formatDateToYYYYMMDD(currentDay);
    const dayAttempts = dayMap.get(dateKey) || [];

    const activityCount = dayAttempts.length;
    const totalSeconds = dayAttempts.reduce(
      (acc, a) => acc + (a.durationSeconds || 0),
      0
    );
    const totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;

    totalActivities += activityCount;
    totalStudyMinutes += totalMinutes;

    const completedActivities = dayAttempts.map((a) => ({
      skill: a.skill,
      mode: a.mode,
      partIdentifier: a.partIdentifier,
    }));

    const intensity = calculateHeatmapIntensity(activityCount, totalMinutes);

    days.push({
      date: dateKey,
      activityCount,
      totalMinutes,
      completedActivities,
      intensity,
    });
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalWeeks: 12,
    days,
    totalActivities,
    totalStudyMinutes: Math.round(totalStudyMinutes * 10) / 10,
  };
}
