import { resolveSpeakingTaskContext, gradeSpeakingSubmission } from "../lib/grading/speaking-ai";

async function run() {
  try {
    const taskContext = resolveSpeakingTaskContext("aptis-b2-01", 2, "t01_s2_q1");
    console.log("Speaking task context resolved:", taskContext.taskType);
    
    const dummyAudioBase64 = Buffer.from(
      "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpnu4tTq4QVSalmU6mnSZeKSZ5cqmZbqYtJqWZtqSZrqWdpqWprqY9prmhpqW1rqY1pqXFpqY9rqXBpqXFsqY5pqXBpqXFsqY5pqXBpqXFsqY5pqXBpqXFsqY5pqXBpqXFsqY5pqXBpqXFs"
    ).toString("base64");

    const result = await gradeSpeakingSubmission(
      taskContext,
      {
        audioBase64: dummyAudioBase64,
        mimeType: "audio/webm",
        durationSeconds: 43,
        clientTranscript: "In this photograph I can see a group of university students studying together in a park. In the foreground two girls are sitting on the grass reading books and discussing their project.",
      },
      undefined,
      "test-learner"
    );

    console.log("SPEAKING SUCCESS!");
    console.log("Audio quality:", result.audioQuality);
    console.log("Overall score:", result.overallScore, "/", result.maxOverallScore);
    console.log("Percentage:", result.percentage, "%");
    console.log("Estimated Band:", result.estimatedBand);
    console.log("Criteria count:", result.criteria.length);
    console.log("Transcript status:", result.transcriptStatus);
    console.log("Pronunciation status:", result.pronunciationStatus);
    console.log("Fluency status:", result.fluencyStatus);
    console.log("Improvement Plan:", result.improvementPlan);
    console.log("Linked Knowledge:", result.linkedKnowledge);
  } catch (err: any) {
    console.error("Direct speaking evaluation error:", err);
  }
}

run();
