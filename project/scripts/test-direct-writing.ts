import { resolveWritingTaskContext, gradeWritingSubmission } from "../lib/grading/writing-ai";

async function run() {
  try {
    const taskContext = resolveWritingTaskContext("aptis-b2-01", 4, "t01_w4_t2_formal");
    console.log("Task context resolved:", taskContext.taskType);
    
    const result = await gradeWritingSubmission(
      taskContext,
      "Dear Sir or Madam,\n\nI am writing with reference to the recent notice regarding the revitalization event for the Debate Club.\n\nWhile I understand that organizing major events requires significant effort, this initiative will greatly encourage more student participation. Many members have expressed their enthusiasm for debating current academic topics.\n\nI would like to propose that the club organize monthly friendly workshops and invite guest speakers from local universities. This would provide valuable learning opportunities while maintaining active club engagement.\n\nThank you for considering my suggestions. I look forward to your reply.\n\nYours faithfully,\nAlex Nguyen",
      undefined,
      "test-learner"
    );
    console.log("SUCCESS!");
    console.log("Overall score:", result.overallScore, "/", result.maxOverallScore);
    console.log("Percentage:", result.percentage, "%");
    console.log("Band:", result.estimatedBand);
    console.log("Criteria count:", result.criteria.length);
    console.log("Vocabulary upgrades:", result.vocabularyUpgrades.length);
    console.log("Improvement Plan:", result.improvementPlan);
    console.log("Linked Knowledge:", result.linkedKnowledge);
  } catch (err: any) {
    console.error("Direct evaluation error:", err);
  }
}

run();
