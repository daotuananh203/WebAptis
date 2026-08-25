/**
 * Adaptive Recommendation Rules
 * Pure rule generators translating learning metrics into prioritized, actionable recommendations.
 */

import { ALL_EXAM_SKILLS } from "../progress/statistics";
import { ExamComponentSkill, OverallLearningStatistics, ProgressAttemptRecord } from "../progress/types";
import { StudyRecommendation } from "./types";

/**
 * Human-readable skill titles.
 */
export const SKILL_LABELS: Record<ExamComponentSkill, string> = {
  grammarVocabulary: "Grammar & Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

/**
 * Human-readable part titles and target practice action mappings in Vietnamese.
 */
export const PART_ACTION_MAPPING: Record<
  string,
  { name: string; action: string; durationMinutes: number }
> = {
  // Grammar & Vocabulary
  grammar: { name: "Grammar (Ngữ pháp)", action: "Luyện 25 câu ngữ pháp B2 về câu điều kiện, modal verbs và mệnh đề quan hệ.", durationMinutes: 12 },
  vocabulary: { name: "Vocabulary (Từ vựng)", action: "Ôn luyện 5 nhóm từ đồng nghĩa và collocations học thuật.", durationMinutes: 13 },
  // Reading
  part1: { name: "Reading Part 1 (Điền từ)", action: "Luyện điền từ vào 5 đoạn văn ngắn dựa vào ngữ cảnh.", durationMinutes: 8 },
  part2: { name: "Reading Part 2 (Sắp xếp câu)", action: "Luyện sắp xếp các câu rời rạc thành đoạn văn mạch lạc.", durationMinutes: 10 },
  part3: { name: "Reading Part 3 (Ghép ý kiến)", action: "Luyện đọc hiểu và ghép ý kiến của 4 nhân vật.", durationMinutes: 12 },
  part4: { name: "Reading Part 4 (Nối tiêu đề)", action: "Luyện kỹ năng đọc lướt tìm ý chính và nối tiêu đề cho 7 đoạn văn.", durationMinutes: 15 },
  // Listening
  l_part1: { name: "Listening Part 1 (Nghe chi tiết)", action: "Nghe 5 đoạn hội thoại ngắn để bắt thông tin thực tế.", durationMinutes: 10 },
  l_part2: { name: "Listening Part 2 (Ghép người nói)", action: "Nghe 4 đoạn độc thoại và nối người nói với hoạt động tương ứng.", durationMinutes: 10 },
  l_part3: { name: "Listening Part 3 (Thảo luận hai người)", action: "Nghe thảo luận và phân biệt quan điểm của nam/nữ.", durationMinutes: 10 },
  l_part4: { name: "Listening Part 4 (Bài giảng học thuật)", action: "Nghe bài giảng dài và trả lời các câu hỏi suy luận.", durationMinutes: 12 },
  // Writing
  w_part1: { name: "Writing Part 1 (Điền thông tin)", action: "Luyện trả lời nhanh 5 câu hỏi thông tin cá nhân (1-5 từ).", durationMinutes: 5 },
  w_part2: { name: "Writing Part 2 (Viết câu ngắn)", action: "Viết đoạn văn ngắn 20-30 từ bằng câu hoàn chỉnh.", durationMinutes: 7 },
  w_part3: { name: "Writing Part 3 (Chat mạng xã hội)", action: "Viết 3 phản hồi chat (khoảng 40 từ mỗi câu) với văn phong tự nhiên.", durationMinutes: 10 },
  w_part4: { name: "Writing Part 4 (Viết email)", action: "Luyện viết email thân mật (40-50 từ) và email trang trọng (120-150 từ).", durationMinutes: 25 },
  // Speaking
  s_part1: { name: "Speaking Part 1 (Hỏi đáp cá nhân)", action: "Luyện trả lời 3 câu hỏi đời sống (30 giây mỗi câu).", durationMinutes: 6 },
  s_part2: { name: "Speaking Part 2 (Miêu tả 1 ảnh)", action: "Miêu tả tranh và kể trải nghiệm bản thân (45 giây mỗi câu).", durationMinutes: 8 },
  s_part3: { name: "Speaking Part 3 (So sánh 2 ảnh)", action: "So sánh 2 bức ảnh và nêu quan điểm cá nhân (45 giây mỗi câu).", durationMinutes: 8 },
  s_part4: { name: "Speaking Part 4 (Thuyết trình chủ đề)", action: "Chuẩn bị 1 phút và nói liên tục trong 2 phút về chủ đề tổng hợp.", durationMinutes: 10 },
};

/**
 * Rule: Empty or Sparse History -> Initial Diagnostic Recommendation
 */
export function generateInitialDiagnosticRecommendations(
  totalAttempts: number
): StudyRecommendation[] {
  if (totalAttempts > 2) return [];

  return [
    {
      id: "rec_initial_diagnostic",
      skill: "grammarVocabulary",
      partIdentifier: "grammar",
      priority: "high",
      scoreWeight: 20,
      title: "Bài tập khởi động: Grammar & Vocabulary",
      reason: "Xác định nhanh năng lực ngữ pháp và từ vựng B2 ban đầu của bạn.",
      suggestedAction: "Hoàn thành 25 câu Ngữ pháp để hệ thống đề xuất lộ trình phù hợp nhất.",
      targetMode: "practice",
      basedOn: "initial_diagnostic",
      estimatedMinutes: 15,
    },
    {
      id: "rec_initial_reading",
      skill: "reading",
      partIdentifier: "part1",
      priority: "medium",
      scoreWeight: 15,
      title: "Luyện kỹ năng Đọc hiểu cơ bản (Part 1)",
      reason: "Làm quen với dạng bài đọc điền từ vào câu ngắn.",
      suggestedAction: "Luyện tập 5 câu điền từ Reading Part 1 để kiểm tra phản xạ đọc hiểu.",
      targetMode: "practice",
      basedOn: "initial_diagnostic",
      estimatedMinutes: 10,
    },
  ];
}

/**
 * Rule: Critical Weakness (<55% average score)
 */
export function generateCriticalWeaknessRecommendations(
  stats: OverallLearningStatistics
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];

  const criticalAreas = stats.weakAreas.filter((w) => w.urgency === "critical");

  for (const area of criticalAreas) {
    const partKey = area.partIdentifier || "part1";
    const mapped = PART_ACTION_MAPPING[partKey] || {
      name: `${SKILL_LABELS[area.skill]} (${area.partIdentifier || "Tổng hợp"})`,
      action: `Tập trung luyện tập để nâng cao độ chính xác phần ${SKILL_LABELS[area.skill]}.`,
      durationMinutes: 15,
    };

    recommendations.push({
      id: `rec_crit_${area.skill}_${area.partIdentifier || "general"}`,
      skill: area.skill,
      partIdentifier: area.partIdentifier,
      priority: "critical",
      scoreWeight: 150 - area.averagePercentage,
      title: `Cải thiện điểm yếu: ${mapped.name}`,
      reason: `Độ chính xác hiện tại đang ở mức ${area.averagePercentage}% (dưới chuẩn 55%).`,
      suggestedAction: mapped.action,
      targetMode: "practice",
      basedOn: "critical_weakness",
      estimatedMinutes: mapped.durationMinutes,
    });
  }

  return recommendations;
}

/**
 * Rule: Moderate Weakness (55-69% average score)
 */
export function generateModerateWeaknessRecommendations(
  stats: OverallLearningStatistics
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];

  const moderateAreas = stats.weakAreas.filter((w) => w.urgency === "moderate");

  for (const area of moderateAreas) {
    const partKey = area.partIdentifier || "part1";
    const mapped = PART_ACTION_MAPPING[partKey] || {
      name: `${SKILL_LABELS[area.skill]} (${area.partIdentifier || "Tổng hợp"})`,
      action: `Luyện tập thêm để nâng độ chính xác lên mức an toàn B2 (>70%).`,
      durationMinutes: 12,
    };

    recommendations.push({
      id: `rec_mod_${area.skill}_${area.partIdentifier || "general"}`,
      skill: area.skill,
      partIdentifier: area.partIdentifier,
      priority: "high",
      scoreWeight: 100 - area.averagePercentage,
      title: `Tăng tốc B2: ${mapped.name}`,
      reason: `Điểm hiện tại đạt ${area.averagePercentage}%, cần thêm một chút để đạt chuẩn vững B2.`,
      suggestedAction: mapped.action,
      targetMode: "practice",
      basedOn: "moderate_weakness",
      estimatedMinutes: mapped.durationMinutes,
    });
  }

  return recommendations;
}

/**
 * Rule: Score Drops & Declining Trend
 */
export function generateDecliningTrendRecommendations(
  stats: OverallLearningStatistics
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];
  if (!stats.skillMetrics) return recommendations;

  for (const [skillKey, metric] of Object.entries(stats.skillMetrics || {})) {
    const skill = skillKey as ExamComponentSkill;
    if (metric.improvementTrend === "declining" && metric.totalAttempts >= 3) {
      recommendations.push({
        id: `rec_trend_declining_${skill}`,
        skill,
        priority: "high",
        scoreWeight: 50,
        title: `Phục hồi phong độ: ${SKILL_LABELS[skill]}`,
        reason: `Điểm số các bài gần đây có xu hướng giảm nhẹ so với bài trước.`,
        suggestedAction: `Luyện lại 1 bài ngắn để lấy lại sự tự tin và ổn định điểm số.`,
        targetMode: "practice",
        basedOn: "declining_trend",
        estimatedMinutes: 15,
      });
    }
  }

  return recommendations;
}

/**
 * Rule: Neglected Skills
 */
export function generateNeglectedSkillRecommendations(
  stats: OverallLearningStatistics
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];
  if (!stats.skillMetrics) return recommendations;

  for (const skill of ALL_EXAM_SKILLS) {
    const metric = stats.skillMetrics[skill];
    if (stats.totalAttempts >= 3 && (!metric || metric.totalAttempts === 0)) {
      recommendations.push({
        id: `rec_neglected_${skill}`,
        skill,
        priority: "medium",
        scoreWeight: 30,
        title: `Luyện tập kỹ năng ${SKILL_LABELS[skill]}`,
        reason: `Bạn chưa làm bài luyện nào cho kỹ năng này.`,
        suggestedAction: `Làm thử 1 bài ${SKILL_LABELS[skill]} để đảm bảo phát triển đồng đều cả 5 phần.`,
        targetMode: "practice",
        basedOn: "neglected_skill",
        estimatedMinutes: 15,
      });
    }
  }

  return recommendations;
}

/**
 * Rule: Full Mock Test Readiness
 */
export function generateMockTestReadinessRecommendations(
  stats: OverallLearningStatistics
): StudyRecommendation[] {
  if (!stats.skillMetrics || stats.totalAttempts < 5) return [];

  const allSkillsAttempted = ALL_EXAM_SKILLS.every(
    (s) => (stats.skillMetrics?.[s]?.totalAttempts || 0) > 0
  );

  const isReady =
    allSkillsAttempted && stats.overallAccuracyPercentage >= 70;

  if (isReady) {
    return [
      {
        id: "rec_mock_test_ready",
        skill: "grammarVocabulary",
        priority: "high",
        scoreWeight: 85,
        title: "Thi thử Mock Test 5 kỹ năng",
        reason: `Độ chính xác trung bình của bạn đã đạt ${stats.overallAccuracyPercentage}% trên tất cả các kỹ năng!`,
        suggestedAction: "Thực hiện bài thi thử hoàn chỉnh 162 phút để kiểm tra áp lực thời gian thực tế.",
        targetMode: "mock-test",
        basedOn: "mock_test_readiness",
        estimatedMinutes: 175,
      },
    ];
  }

  return [];
}
