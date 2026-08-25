import { z } from "zod";

export type KnowledgeCategory =
  | "Grammar"
  | "Vocabulary"
  | "Reading Strategy"
  | "Listening Strategy"
  | "Writing Strategy"
  | "Speaking Strategy"
  | "Exam Strategy"
  | "Common Mistakes"
  | "B2 Language Tips";

export interface KnowledgeItem {
  id: string;
  skill: "Grammar" | "Vocabulary" | "Reading" | "Listening" | "Writing" | "Speaking" | "General";
  part?: string;
  category: KnowledgeCategory;
  topic: string;
  summary: string;
  content: string;
  tags: string[];
  sourceFile: string;
  sourceName: string;
  sourceType: "edulife" | "synthetic" | "project-created";
  isOfficialBritishCouncil: boolean;
}

export const KnowledgeItemSchema = z.object({
  id: z.string().min(1),
  skill: z.enum(["Grammar", "Vocabulary", "Reading", "Listening", "Writing", "Speaking", "General"]),
  part: z.string().optional(),
  category: z.enum([
    "Grammar",
    "Vocabulary",
    "Reading Strategy",
    "Listening Strategy",
    "Writing Strategy",
    "Speaking Strategy",
    "Exam Strategy",
    "Common Mistakes",
    "B2 Language Tips",
  ]),
  topic: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).min(1),
  sourceFile: z.string().min(1),
  sourceName: z.string().min(1),
  sourceType: z.enum(["edulife", "synthetic", "project-created"]),
  isOfficialBritishCouncil: z.boolean(),
});
