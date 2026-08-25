import { z } from "zod";

// ==========================================
// 1. METADATA & FORMAT SCHEMA
// ==========================================

export const FormatMetadataSchema = z.object({
  name: z.enum(["Aptis ESOL General", "Aptis General"]),
  targetLevel: z.enum(["B1", "B2", "C1"]),
  version: z.string().min(1),
  sourceCheckedAt: z.string().min(1),
});

export const TestMetadataSchema = z.object({
  testId: z.string().min(1),
  title: z.string().min(1),
  format: FormatMetadataSchema,
  version: z.string().min(1),
  sourceType: z.enum(["synthetic", "project-created", "edulife"]),
  sourceName: z.string().optional(),
  isOfficialBritishCouncil: z.boolean().optional(),
  isComplete: z.boolean().optional(),
  audioStatus: z.enum(["available", "missing"]).optional(),
  description: z.string().min(1),
  totalTimeMinutes: z.number().positive(),
});

// ==========================================
// 2. GRAMMAR & VOCABULARY SCHEMAS
// ==========================================

export const GrammarQuestionPublicSchema = z.object({
  id: z.string().min(1),
  questionNumber: z.number().positive(),
  sentence: z.string().min(1),
  options: z.tuple([z.string(), z.string(), z.string()]),
});

export const GrammarSectionPublicSchema = z.object({
  timeLimitMinutes: z.literal(25),
  totalQuestions: z.number().positive(),
  questions: z.array(GrammarQuestionPublicSchema).min(1),
});

export const VocabularySetItemSchema = z.object({
  id: z.string().min(1),
  targetWordOrPrompt: z.string().min(1),
});

export const VocabularySetPublicSchema = z.object({
  id: z.string().min(1),
  setIndex: z.number().positive(),
  type: z.enum([
    "synonyms",
    "definitions",
    "sentence-completion",
    "collocations",
    "phrasal-verbs",
  ]),
  instructions: z.string().min(1),
  items: z.array(VocabularySetItemSchema).min(1),
  options: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
    })
  ).min(2),
});

export const VocabularySectionPublicSchema = z.object({
  timeLimitMinutes: z.literal(25),
  totalQuestions: z.number().positive(),
  sets: z.array(VocabularySetPublicSchema).min(1),
});

export const GrammarVocabularySectionPublicSchema = z.object({
  officialDurationMinutes: z.literal(25),
  grammar: GrammarSectionPublicSchema,
  vocabulary: VocabularySectionPublicSchema,
});

// ==========================================
// 3. READING SCHEMAS
// ==========================================

export const ReadingPart1Schema = z.object({
  partNumber: z.literal(1),
  taskType: z.literal("sentence-completion"),
  title: z.string(),
  instructions: z.string(),
  textWithGaps: z.string(),
  gaps: z.array(
    z.object({
      id: z.string(),
      options: z.tuple([z.string(), z.string(), z.string()]),
    })
  ).min(1),
});

export const ReadingPart2Schema = z.object({
  partNumber: z.literal(2),
  taskType: z.literal("text-cohesion"),
  title: z.string(),
  instructions: z.string(),
  stories: z.array(
    z.object({
      id: z.string(),
      anchorSentence: z.string(),
      sentencesToOrder: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
        })
      ).min(2),
    })
  ).min(1),
});

export const ReadingPart3Schema = z.object({
  partNumber: z.literal(3),
  taskType: z.literal("opinion-matching"),
  title: z.string(),
  instructions: z.string(),
  topic: z.string(),
  people: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      biographyText: z.string(),
    })
  ).min(2),
  statements: z.array(
    z.object({
      id: z.string(),
      statement: z.string(),
    })
  ).min(1),
});

export const ReadingPart4Schema = z.object({
  partNumber: z.literal(4),
  taskType: z.literal("matching-headings"),
  title: z.string(),
  instructions: z.string(),
  textTitle: z.string(),
  headings: z.array(
    z.object({
      id: z.string(),
      headingText: z.string(),
    })
  ).min(2),
  paragraphs: z.array(
    z.object({
      id: z.string(),
      paragraphIndex: z.number(),
      text: z.string(),
    })
  ).min(1),
});

export const ReadingSectionSchema = z.object({
  officialDurationMinutes: z.literal(35),
  parts: z.tuple([
    ReadingPart1Schema,
    ReadingPart2Schema,
    ReadingPart3Schema,
    ReadingPart4Schema,
  ]),
});

// ==========================================
// 4. LISTENING SCHEMAS
// ==========================================

export const ListeningPlaybackRulesSchema = z.object({
  maxPlays: z.literal(2),
});

export const ListeningAudioObjectSchema = z.object({
  type: z.string(),
  url: z.string(),
  status: z.enum(["available", "missing", "VERIFIED", "NOT_VERIFIED", "PARTIALLY_VERIFIED", "segment"]),
  audioSegmentStatus: z.enum(["VERIFIED", "NOT_VERIFIED"]).optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  source: z.string().optional(),
  sharedGroupId: z.string().optional(),
});

export const ListeningPart1Schema = z.object({
  partNumber: z.literal(1),
  taskType: z.literal("information-recognition"),
  instructions: z.string(),
  audio: ListeningAudioObjectSchema.optional(),
  audioUrl: z.string().optional(),
  playbackRules: ListeningPlaybackRulesSchema.optional(),
  tasks: z.array(
    z.object({
      id: z.string(),
      audioUrl: z.string().optional(),
      audio: ListeningAudioObjectSchema.optional(),
      playbackRules: ListeningPlaybackRulesSchema.optional(),
      questionNumber: z.number().optional(),
      questionText: z.string(),
      options: z.array(z.string()).min(2),
      sourceFile: z.string().optional(),
    })
  ).min(1),
});

export const ListeningPart2Schema = z.object({
  partNumber: z.literal(2),
  taskType: z.literal("speaker-information-matching"),
  instructions: z.string(),
  topic: z.string().optional(),
  audio: ListeningAudioObjectSchema.optional(),
  audioUrl: z.string().optional(),
  playbackRules: ListeningPlaybackRulesSchema.optional(),
  speakers: z.array(
    z.object({
      id: z.string(),
      speakerLabel: z.string(),
      audio: ListeningAudioObjectSchema.optional(),
    })
  ).min(2),
  statementOptions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    })
  ).min(2),
});

export const ListeningPart3Schema = z.object({
  partNumber: z.literal(3),
  taskType: z.literal("opinion-discussion"),
  instructions: z.string(),
  audio: ListeningAudioObjectSchema.optional(),
  audioUrl: z.string().optional(),
  playbackRules: ListeningPlaybackRulesSchema.optional(),
  topic: z.string().optional(),
  statements: z.array(
    z.object({
      id: z.string(),
      statementText: z.string(),
      options: z.array(z.string()).min(2),
      audio: ListeningAudioObjectSchema.optional(),
    })
  ).min(1),
});

export const ListeningPart4Schema = z.object({
  partNumber: z.literal(4),
  taskType: z.literal("extended-monologue"),
  instructions: z.string(),
  audio: ListeningAudioObjectSchema.optional(),
  audioUrl: z.string().optional(),
  playbackRules: ListeningPlaybackRulesSchema.optional(),
  monologues: z.array(
    z.object({
      id: z.string(),
      audio: ListeningAudioObjectSchema.optional(),
      audioUrl: z.string().optional(),
      playbackRules: ListeningPlaybackRulesSchema.optional(),
      topic: z.string(),
      questions: z.array(
        z.object({
          id: z.string(),
          questionNumber: z.number().optional(),
          questionText: z.string(),
          options: z.array(z.string()).min(2),
        })
      ).min(1),
    })
  ).min(1),
});

export const ListeningSectionSchema = z.object({
  officialDurationMinutes: z.literal(40),
  audio: ListeningAudioObjectSchema.optional(),
  parts: z.tuple([
    ListeningPart1Schema,
    ListeningPart2Schema,
    ListeningPart3Schema,
    ListeningPart4Schema,
  ]),
});


// ==========================================
// 5. WRITING SCHEMAS
// ==========================================

export const WordGuidanceSchema = z.object({
  officialGuidance: z.string().min(1),
  projectValidationRule: z.object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
    recommended: z.number().positive().optional(),
  }),
});

export const WritingPart1Schema = z.object({
  partNumber: z.literal(1),
  taskType: z.literal("form-filling-personal"),
  instructions: z.string(),
  clubContext: z.string(),
  prompts: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      wordGuidance: WordGuidanceSchema,
    })
  ).min(1),
});

export const WritingPart2Schema = z.object({
  partNumber: z.literal(2),
  taskType: z.literal("short-personal-text"),
  instructions: z.string(),
  clubContext: z.string(),
  prompt: z.string(),
  wordGuidance: WordGuidanceSchema,
});

export const WritingPart3Schema = z.object({
  partNumber: z.literal(3),
  taskType: z.literal("social-network-chat"),
  instructions: z.string(),
  clubContext: z.string(),
  chatMessages: z.array(
    z.object({
      id: z.string(),
      senderName: z.string(),
      messageText: z.string(),
      wordGuidance: WordGuidanceSchema,
    })
  ).min(1),
});

export const WritingPart4Schema = z.object({
  partNumber: z.literal(4),
  taskType: z.literal("email-writing"),
  instructions: z.string(),
  clubContext: z.string(),
  managerNotice: z.string(),
  tasks: z.array(
    z.object({
      taskType: z.enum(["informal-email", "formal-email"]),
      id: z.string(),
      recipient: z.string(),
      prompt: z.string(),
      wordGuidance: WordGuidanceSchema,
    })
  ).min(2),
});

export const WritingSectionSchema = z.object({
  officialDurationMinutes: z.literal(50),
  projectSuggestedPartTimers: z
    .object({
      part1Minutes: z.number(),
      part2Minutes: z.number(),
      part3Minutes: z.number(),
      part4Minutes: z.number(),
    })
    .optional(),
  parts: z.tuple([
    WritingPart1Schema,
    WritingPart2Schema,
    WritingPart3Schema,
    WritingPart4Schema,
  ]),
});

// ==========================================
// 6. SPEAKING SCHEMAS
// ==========================================

export const SpeakingPart1Schema = z.object({
  partNumber: z.literal(1),
  taskType: z.literal("personal-information"),
  instructions: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      preparationTimeSeconds: z.literal(0),
      responseTimeSeconds: z.number().positive(),
    })
  ).min(1),
});

export const SpeakingPart2Schema = z.object({
  partNumber: z.literal(2),
  taskType: z.literal("describe-recount-opinion"),
  instructions: z.string(),
  imageUrl: z.string(),
  imageAlt: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      preparationTimeSeconds: z.literal(0),
      responseTimeSeconds: z.number().positive(),
    })
  ).min(1),
});

export const SpeakingPart3Schema = z.object({
  partNumber: z.literal(3),
  taskType: z.literal("compare-speculate-opinion"),
  instructions: z.string(),
  images: z.object({
    image1Url: z.string(),
    image1Alt: z.string(),
    image2Url: z.string(),
    image2Alt: z.string(),
  }),
  questions: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      preparationTimeSeconds: z.literal(0),
      responseTimeSeconds: z.number().positive(),
    })
  ).min(1),
});

export const SpeakingPart4Schema = z.object({
  partNumber: z.literal(4),
  taskType: z.literal("abstract-topic-extended"),
  instructions: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  topic: z.string(),
  questions: z.array(z.string()).min(1),
  preparationTimeSeconds: z.literal(60),
  responseTimeSeconds: z.literal(120),
});

export const SpeakingSectionSchema = z.object({
  officialDurationMinutes: z.literal(12),
  parts: z.tuple([
    SpeakingPart1Schema,
    SpeakingPart2Schema,
    SpeakingPart3Schema,
    SpeakingPart4Schema,
  ]),
});

// ==========================================
// 7. ROOT DATASET SCHEMAS
// ==========================================

export const AptisPublicTestDatasetSchema = z.object({
  metadata: TestMetadataSchema,
  grammarVocabulary: GrammarVocabularySectionPublicSchema,
  reading: ReadingSectionSchema,
  listening: ListeningSectionSchema,
  writing: WritingSectionSchema,
  speaking: SpeakingSectionSchema,
});

export const ServerAnswerKeySchema = z.object({
  testId: z.string().min(1),
  version: z.string().min(1),
  grammarVocabulary: z.object({
    grammarAnswers: z.record(z.string(), z.string()),
    vocabularyAnswers: z.record(z.string(), z.string()),
  }),
  reading: z.object({
    part1: z.record(z.string(), z.string()),
    part2: z.record(z.string(), z.array(z.string())),
    part3: z.record(z.string(), z.string()),
    part4: z.record(z.string(), z.string()),
  }),
  listening: z.object({
    part1: z.record(z.string(), z.string()),
    part2: z.record(z.string(), z.string()),
    part3: z.record(z.string(), z.enum(["Man", "Woman", "Both"])),
    part4: z.record(z.string(), z.string()),
  }),
  scoringRules: z.object({
    grammarMaxPoints: z.number().positive(),
    vocabularyMaxPoints: z.number().positive(),
    readingMaxPoints: z.number().positive(),
    listeningMaxPoints: z.number().positive(),
    disclaimer: z.literal("PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE"),
  }),
});
