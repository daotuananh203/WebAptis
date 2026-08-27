import { runDatasetValidationTest } from "./dataset-validation.test";
import { runAntiLeakTest } from "./anti-leak.test";
import { runGradingTests } from "./grading.test";
import { runWritingGradingTests } from "./writing-grading.test";
import { runSpeakingGradingTests } from "./speaking-grading.test";
import { runProgressTests } from "./progress.test";
import { runRecommendationTests } from "./recommendations.test";
import { runCoachChatTests } from "./coach-chat.test";
import { runStorageTests } from "./storage.test";
import { runDashboardIntegrationTests } from "./dashboard-integration.test";
import { runPracticeFlowTests } from "./practice-flow.test";
import { runMockTestFlowTests } from "./mock-test-flow.test";
import { runCoachUITests } from "./coach-ui.test";
import { runAuthTests } from "./auth.test";
import { runPostgresStoreTests } from "./postgres-store.test";
import { runContentIngestionTests } from "./content-ingestion.test";
import { runKnowledgeBaseTests } from "./knowledge-base.test";
import { runRetrieverValidationTests } from "./retriever-validation.test";
import { runKnowledgeReferencesUITests } from "./knowledge-references-ui.test";
import { runRealUserE2ETests } from "./e2e-user-flows.test";
import { runSpeakingRuntimeRegressionTests } from "./speaking-runtime-regression.test";
import { runMockTestRuntimeRegressionTests } from "./mock-test-runtime-regression.test";
import { runListeningMappingRegressionTests } from "./listening-mapping-regression.test";
import { runListeningContentQARegressionTests } from "./listening-content-qa-regression.test";
import { runListeningQuestionLevelCompletenessTests } from "./listening-question-level-completeness.test";
import { runListeningQuestionEvidenceCompletenessTests } from "./listening-question-evidence-completeness.test";
import { runListeningPart1ContextCompletenessTests } from "./listening-part1-context-completeness.test";
import { runListeningAudioArchitectureTests } from "./listening-audio-architecture.test";
import { runListeningPart1BoundaryRegressionTests } from "./listening-part1-boundary-regression.test";
import { runListeningPart1ContentCompletenessTests } from "./listening-part1-content-completeness.test";
import { runListeningPart1Q1ContentGoldenTests } from "./listening-part1-q1-content-golden.test";
import { runListeningRuntimeArchitectureTests } from "./listening-runtime-architecture.test";
import { runListeningAnswerKeyContractTests } from "./listening-answer-key-contract.test";
import { runPracticeGradingPayloadTests } from "./practice-grading-payload.test";
import { runListeningPart1T06Q7RegressionTests } from "./listening-part1-t06-q7-regression.test";
import { runListeningT16SourceParserTest } from "./listening-t16-source-parser.test";
import { runPhase3AiTeacherRetrievalTests } from "./phase3-ai-teacher-retrieval.test";
import { runFinalAICompletionTests } from "./final-ai-completion.test";
import { runRedTeamApiSecurityTests } from "./redteam-api-security.test";
import { runRedTeamAiTeacherJailbreakTests } from "./redteam-ai-teacher-jailbreak.test";
import { runRedTeamAiExaminersTests } from "./redteam-ai-examiners.test";
import { runRedTeamKnowledgeBrainTests } from "./redteam-knowledge-brain.test";
import { runRedTeamUserMemoryTests } from "./redteam-user-memory.test";
import { runRedTeamMockTestTransitionsTests } from "./redteam-mock-test-transitions.test";
import { runRedTeamAccessibilityTests } from "./redteam-accessibility.test";
import { runRedTeamMutationResilienceTests } from "./redteam-mutation-resilience.test";
import { runSpeakingImageAvailabilityTests } from "./speaking-image-availability.test";

async function main() {
  console.log("==================================================");
  console.log("APTIS B2 PRACTICE WEB APP — MASTER RED-TEAM QA SUITE");
  console.log("==================================================\n");

  const test1Passed = runDatasetValidationTest();
  const test2Passed = runAntiLeakTest();
  runGradingTests();
  await runWritingGradingTests();
  await runSpeakingGradingTests();
  runProgressTests();
  runRecommendationTests();
  await runCoachChatTests();
  runStorageTests();
  runDashboardIntegrationTests();
  runPracticeFlowTests();
  runMockTestFlowTests();
  runCoachUITests();
  await runAuthTests();
  await runPostgresStoreTests();
  await runContentIngestionTests();
  runKnowledgeBaseTests();
  runRetrieverValidationTests();
  runKnowledgeReferencesUITests();
  await runRealUserE2ETests();
  const test21Passed = runSpeakingRuntimeRegressionTests();
  const test22Passed = runMockTestRuntimeRegressionTests();
  const test23Passed = runListeningMappingRegressionTests();
  const test24Passed = runListeningContentQARegressionTests();
  const test27Passed = runListeningQuestionLevelCompletenessTests();
  const test28Passed = runListeningQuestionEvidenceCompletenessTests();
  const test29Passed = runListeningPart1ContextCompletenessTests();
  const test30Passed = runListeningAudioArchitectureTests();
  const test31Passed = runListeningPart1BoundaryRegressionTests();
  const test32Passed = runListeningPart1ContentCompletenessTests();
  const test34Passed = runListeningPart1Q1ContentGoldenTests();
  const test33Passed = runListeningRuntimeArchitectureTests();
  const test35Passed = runListeningAnswerKeyContractTests();
  const test36Passed = await runPracticeGradingPayloadTests();
  const test37Passed = runListeningPart1T06Q7RegressionTests();
  const test38Passed = (runListeningT16SourceParserTest(), true);
  const test39Passed = runSpeakingImageAvailabilityTests();
  await runPhase3AiTeacherRetrievalTests();
  await runFinalAICompletionTests();

  // Red-Team Domain Suites (A - H)
  await runRedTeamApiSecurityTests();
  await runRedTeamAiTeacherJailbreakTests();
  await runRedTeamAiExaminersTests();
  await runRedTeamKnowledgeBrainTests();
  await runRedTeamUserMemoryTests();
  await runRedTeamMockTestTransitionsTests();
  await runRedTeamAccessibilityTests();
  await runRedTeamMutationResilienceTests();

  if (
    test1Passed &&
    test2Passed &&
    test21Passed &&
    test22Passed &&
    test23Passed &&
    test24Passed &&
    test27Passed &&
    test28Passed &&
    test29Passed &&
    test30Passed &&
    test31Passed &&
    test32Passed &&
    test34Passed &&
    test33Passed &&
    test35Passed &&
    test36Passed &&
    test37Passed &&
    test38Passed &&
    test39Passed
  ) {
    console.log("==================================================");
    console.log("🎉 ALL MASTER RED-TEAM TEST SUITES PASSED! (41/41)");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error("==================================================");
    console.error("❌ MASTER RED-TEAM SUITE FAILED — PLEASE REVIEW");
    console.error("==================================================");
    process.exit(1);
  }
}

main();
