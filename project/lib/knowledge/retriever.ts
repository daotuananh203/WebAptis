import fs from "fs";
import path from "path";
import { KnowledgeItem, KnowledgeCategory } from "./types";
import { loadKnowledgeFromObsidianVault } from "./obsidian-adapter";

let cachedKnowledge: KnowledgeItem[] | null = null;

export function loadAllKnowledge(): KnowledgeItem[] {
  if (cachedKnowledge) return cachedKnowledge;

  const itemsMap = new Map<string, KnowledgeItem>();

  // 1. Primary Source: Load all notes from Obsidian Knowledge Brain
  try {
    const vaultItems = loadKnowledgeFromObsidianVault();
    for (const it of vaultItems) {
      // Filter out internal system governance and QA audit notes from runtime user knowledge
      if (
        it.id.includes("10-qa") ||
        it.id.includes("00-system") ||
        it.id.includes("15-user-memory") ||
        it.id.includes("audit")
      ) {
        continue;
      }
      itemsMap.set(it.id, it);
    }
  } catch (err) {
    console.error("Failed to load Obsidian vault knowledge:", err);
  }

  // 2. Secondary / Fallback Source: Load from data/knowledge/index.json
  try {
    const p = path.join(process.cwd(), "data/knowledge/index.json");
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf-8");
      const json = JSON.parse(raw);
      const staticItems: KnowledgeItem[] = json.items || [];
      for (const it of staticItems) {
        if (!itemsMap.has(it.id)) {
          itemsMap.set(it.id, it);
        }
      }
    }
  } catch (err) {
    console.error("Failed to load static knowledge base:", err);
  }

  cachedKnowledge = Array.from(itemsMap.values());
  return cachedKnowledge;
}

export function invalidateKnowledgeCache(): void {
  cachedKnowledge = null;
}

// ============================================================
// Multi-lingual (English + Vietnamese) synonym / alias map
// ============================================================
const VI_ALIAS_MAP: Record<string, string[]> = {
  // Skills
  "đọc": ["reading"],
  "reading": ["reading", "comprehension"],
  "nghe": ["listening"],
  "listening": ["listening", "audio"],
  "viết": ["writing", "email", "formal", "informal"],
  "writing": ["writing", "email", "formal", "informal", "essay"],
  "nói": ["speaking"],
  "speaking": ["speaking", "presentation", "fluency", "pronunciation"],
  "ngữ pháp": ["grammar", "tenses", "conditional", "inversion", "relative", "passive"],
  "grammar": ["grammar", "tenses", "conditional", "inversion", "relative", "passive"],
  "từ vựng": ["vocabulary", "synonyms", "collocations", "phrasal-verbs", "definitions"],
  "vocabulary": ["vocabulary", "synonyms", "collocations", "phrasal-verbs", "definitions"],

  // Parts
  "phần 1": ["part1", "part 1"],
  "part 1": ["part1", "part 1"],
  "part 2": ["part2", "part 2"],
  "phần 2": ["part2", "part 2"],
  "part 3": ["part3", "part 3"],
  "phần 3": ["part3", "part 3"],
  "part 4": ["part4", "part 4"],
  "phần 4": ["part4", "part 4"],

  // Grammar concepts
  "present perfect": ["present-perfect", "tenses", "grammar", "since", "already"],
  "hiện tại hoàn thành": ["present-perfect", "tenses", "grammar"],
  "past simple": ["past-simple", "tenses", "grammar", "yesterday"],
  "quá khứ đơn": ["past-simple", "tenses", "grammar"],
  "conditional": ["conditionals", "if-clause", "grammar"],
  "câu điều kiện": ["conditionals", "if-clause", "grammar"],
  "đảo ngữ": ["inversion", "inversion"],
  "inversion": ["inversion", "inversion"],
  "passive voice": ["passive-voice", "passive", "grammar"],
  "câu bị động": ["passive-voice", "passive", "grammar"],
  "relative clauses": ["relative-clauses", "relative", "grammar", "which", "who"],
  "mệnh đề quan hệ": ["relative-clauses", "relative", "grammar"],
  "phrasal verbs": ["phrasal-verbs", "phrasal", "vocabulary", "prepositions"],
  "cụm động từ": ["phrasal-verbs", "phrasal", "vocabulary"],
  "modal verbs": ["modals", "grammar", "modal"],
  "động từ khuyết thiếu": ["modals", "grammar"],
  "gerund": ["gerund", "infinitive", "verb-form"],
  "to-v": ["gerund", "infinitive", "verb-form"],
  "v-ing": ["gerund", "infinitive", "verb-form"],
  "động từ": ["gerund", "infinitive", "grammar", "verb"],
  "dùng": ["usage", "grammar", "gerund", "infinitive"],
  "giới từ": ["prepositions", "grammar", "collocations", "phrasal-verbs"],
  "preposition": ["prepositions", "grammar", "collocations", "phrasal-verbs"],
  "prepositions": ["prepositions", "grammar", "collocations", "phrasal-verbs"],
  "danh từ": ["vocabulary", "grammar", "nouns"],
  "used to": ["grammar", "tenses", "verb-form"],
  "be used to": ["grammar", "tenses", "verb-form"],
  "get used to": ["grammar", "tenses", "verb-form"],
  "mạo từ": ["articles", "grammar"],
  "article": ["articles", "grammar"],
  "articles": ["articles", "grammar"],
  "liên từ": ["linking-words", "connectors", "cohesion", "grammar"],
  "tương phản": ["linking-words", "connectors", "cohesion", "grammar"],
  "although": ["linking-words", "connectors", "cohesion", "grammar"],
  "despite": ["linking-words", "connectors", "cohesion", "grammar"],
  "however": ["linking-words", "connectors", "cohesion", "grammar"],
  "câu chẻ": ["cleft-sentences", "inversion", "grammar"],
  "giả định": ["subjunctive", "grammar"],
  "subjunctive": ["subjunctive", "grammar"],
  "câu hỏi đuôi": ["tag-questions", "grammar"],
  "tag question": ["tag-questions", "grammar"],
  "tag questions": ["tag-questions", "grammar"],
  "tính từ": ["adjectives", "grammar"],
  "osascomp": ["adjectives", "grammar"],
  "phát âm": ["pronunciation", "speaking", "phonetics"],
  "pronunciation": ["pronunciation", "speaking", "phonetics"],
  "ngữ điệu": ["intonation", "speaking", "fluency"],
  "trôi chảy": ["fluency", "speaking"],
  "fluency": ["fluency", "speaking"],
  "ngập ngừng": ["fluency", "speaking", "hesitation"],
  "từ đệm": ["fluency", "speaking", "hesitation", "fillers"],
  "đệm": ["fluency", "speaking", "hesitation", "fillers"],
  "filler": ["fluency", "speaking", "hesitation", "fillers"],
  "fillers": ["fluency", "speaking", "hesitation", "fillers"],

  // Vocabulary concepts
  "collocation": ["collocations", "vocabulary", "b2"],
  "collocations": ["collocations", "vocabulary", "b2"],
  "synonym": ["synonyms", "vocabulary", "definitions"],
  "synonyms": ["synonyms", "vocabulary", "definitions"],
  "từ đồng nghĩa": ["synonyms", "vocabulary"],
  "định nghĩa": ["definitions", "vocabulary"],
  "phân biệt": ["common-errors", "vocabulary", "word-choice", "grammar"],
  "sensitive": ["vocabulary", "common-errors", "word-choice"],
  "sensible": ["vocabulary", "common-errors", "word-choice"],
  "economic": ["vocabulary", "common-errors", "word-choice"],
  "economical": ["vocabulary", "common-errors", "word-choice"],
  "say and tell": ["vocabulary", "common-errors", "say-tell", "word-choice"],
  "say vs tell": ["vocabulary", "common-errors", "say-tell", "word-choice"],

  // Unaccented & Colloquial aliases
  "tu vung": ["vocabulary", "synonyms", "collocations"],
  "ngu phap": ["grammar", "tenses"],
  "hoc": ["vocabulary", "grammar", "tips"],
  "loi khuyen": ["tips", "strategy"],
  "kinh nghiem": ["strategy", "exam-prep"],
  "bi mat": ["strategy", "tips"],
  "buon ngu": ["strategy", "tips"],
  "gap": ["strategy", "tips"],
  "pass": ["strategy", "exam-prep", "b2"],
  "ielts": ["exam-prep", "b2"],

  // Writing specific
  "thư trang trọng": ["formal", "formal-email", "formal email", "dear sir", "writing"],
  "formal email": ["formal", "formal-email", "formal email", "writing", "part4", "dear sir"],
  "thư thân mật": ["informal", "informal-email", "informal email", "writing", "part4"],
  "informal email": ["informal", "informal-email", "informal email", "writing", "part4"],
  "email": ["email", "writing", "part4", "formal", "informal"],
  "phòng chat": ["chat", "social-network-chat", "part3", "writing"],
  "chatroom": ["chat", "social-network-chat", "part3", "writing"],
  "điền form": ["form-filling", "form", "part1", "writing"],
  "form filling": ["form-filling", "form", "part1", "writing"],

  // Reading specific
  "đoạn văn": ["paragraph", "text", "reading"],
  "tiêu đề": ["heading", "matching-headings", "part4", "reading"],
  "heading": ["heading", "matching-headings", "part4", "reading"],
  "headings": ["heading", "matching-headings", "part4", "reading"],
  "ghép tiêu đề": ["matching-headings", "part4", "reading"],
  "sắp xếp câu": ["sentence-ordering", "text-cohesion", "part2", "reading"],
  "cohesion": ["text-cohesion", "sentence-ordering", "part2", "reading"],
  "ý kiến": ["opinion-matching", "part3", "reading"],
  "opinion matching": ["opinion-matching", "part3", "reading"],
  "đọc hiểu": ["reading", "comprehension"],
  "đọc bài dài": ["matching-headings", "part4", "reading"],

  // Listening specific
  "nghe hội thoại": ["short-dialogues", "part1", "listening"],
  "short dialogues": ["short-dialogues", "part1", "listening"],
  "distractors": ["distractors", "traps", "listening", "part1"],
  "bẫy": ["traps", "distractors", "common-traps", "listening"],
  "traps": ["traps", "distractors", "common-traps"],
  "bẫy thay đổi giá tiền": ["short-dialogues", "distractors", "part1", "listening"],
  "ghép ý kiến": ["speaker-matching", "part2", "opinion", "listening"],
  "speaker matching": ["speaker-matching", "part2", "listening"],
  "nam nữ": ["man", "woman", "both", "part3", "opinion-discussion", "listening"],
  "discussion": ["opinion-discussion", "part3", "listening"],
  "bài giảng": ["extended-monologue", "lecture", "part4", "listening"],
  "monologue": ["extended-monologue", "lecture", "part4", "listening"],

  // Speaking specific
  "miêu tả tranh": ["photo-description", "part2", "describe", "speaking"],
  "picture description": ["photo-description", "part2", "describe", "speaking", "picture"],
  "describe photo": ["photo-description", "part2", "describe", "speaking", "picture"],
  "so sánh tranh": ["compare-contrast", "two-photos", "part3", "speaking"],
  "compare pictures": ["compare-contrast", "two-photos", "part3", "speaking"],
  "thuyết trình": ["presentation", "long-speech", "part4", "abstract", "speaking"],
  "presentation": ["presentation", "long-speech", "part4", "speaking"],
  "tả ảnh": ["photo-description", "part2", "speaking"],
  "prep framework": ["prep", "idea-expansion", "speaking", "strategy"],
  "idea development": ["idea-expansion", "development", "speaking", "prep"],
  "hesitation": ["hesitation", "fillers", "fluency", "speaking"],
  "tránh ngập ngừng": ["hesitation", "speaking", "common-mistakes"],

  // Common tasks & rules
  "chiến thuật": ["strategy", "tips", "technique"],
  "strategy": ["strategy", "tips", "technique"],
  "mẹo": ["tips", "strategy", "technique"],
  "lỗi thường gặp": ["common-mistakes", "mistakes", "errors"],
  "mistakes": ["common-mistakes", "mistakes", "errors"],
  "cách làm": ["strategy", "approach", "steps"],
  "quản lý thời gian": ["time-management", "exam-strategy", "timing"],
  "không đủ thời gian": ["time-management", "exam-strategy", "timing"],
  "band b2": ["b2-tips", "b2", "level"],
  "nâng band": ["b2-tips", "upgrade", "vocabulary-upgrade"],
  "nâng điểm": ["b2-tips", "upgrade", "vocabulary-upgrade"],
  "viết tắt": ["common-mistakes", "contractions", "writing"],
  "look into": ["phrasal-verbs", "vocabulary"],
  "turn down": ["phrasal-verbs", "vocabulary"],
  "rubric": ["rubrics", "criteria", "grading", "evaluation"],
  "rubrics": ["rubrics", "criteria", "grading", "evaluation"],
  "tiêu chí chấm": ["rubrics", "criteria", "grading", "evaluation"],
  "scoring": ["grading", "rubrics", "criteria", "evaluation"],
  "correct my": ["correction", "diagnostic", "feedback", "writing", "speaking"],
  "chữa bài": ["correction", "diagnostic", "feedback"],
};

const VI_STOP_WORDS = new Set([
  // Articles / pronouns
  "của", "cho", "trong", "khi", "nào", "đây", "này", "đó", "các", "một",
  "với", "theo", "từ", "và", "hay", "hoặc", "nhưng", "nếu", "thì", "là",
  "có", "không", "được", "đã", "sẽ", "đang", "bị", "để", "về", "như",
  "tôi", "bạn", "mình", "anh", "chị", "họ", "chúng", "những", "gì",
  // Question words
  "làm", "thế", "nào", "sao", "vào", "lúc", "ngày", "mai", "nay",
  // Filler words
  "cũng", "đều", "rất", "nhiều", "ít", "hơn", "nhất", "thật", "quá",
  // Generic verbs / nouns too common or irrelevant
  "nấu", "ăn", "uống", "đi", "đến", "lại", "bò", "phở", "gia", "đình",
  "người", "trời", "mưa", "nắng", "nhiệt", "độ", "tiết", "hà", "nội",
  // English stop words
  "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "for", "on",
  "with", "at", "by", "from", "up", "about", "into", "over", "after",
]);

function expandQueryTerms(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const baseWords = lowerQuery
    .split(/[\s,.?!;:"'()\[\]{}]+/)
    .filter((w) => w.length >= 2 && !VI_STOP_WORDS.has(w));
  const expanded = new Set<string>(baseWords);

  for (const [phrase, canonicals] of Object.entries(VI_ALIAS_MAP)) {
    if (lowerQuery.includes(phrase)) {
      for (const c of canonicals) {
        expanded.add(c);
      }
    }
  }

  return Array.from(expanded);
}

function scoreItem(item: KnowledgeItem, terms: string[], lowerQuery: string): number {
  let score = 0;
  const tagText = item.tags.join(" ").toLowerCase();
  const topicText = item.topic.toLowerCase();
  const summaryText = item.summary.toLowerCase();
  const contentText = item.content.toLowerCase();
  const partText = (item.part ?? "").toLowerCase();
  const skillText = item.skill.toLowerCase();
  const categoryText = item.category.toLowerCase();

  // Strict skill isolation to prevent cross-skill false positives (e.g. Reading Part 3 vs Listening Part 3)
  const isExplicitReadingQuery = lowerQuery.includes("reading") || lowerQuery.includes("đọc");
  const isExplicitListeningQuery = lowerQuery.includes("listening") || lowerQuery.includes("nghe");
  const isExplicitWritingQuery = lowerQuery.includes("writing") || lowerQuery.includes("viết");
  const isExplicitSpeakingQuery = lowerQuery.includes("speaking") || lowerQuery.includes("nói");

  if (isExplicitReadingQuery && skillText === "listening") return -100;
  if (isExplicitListeningQuery && skillText === "reading") return -100;
  if (isExplicitWritingQuery && skillText === "speaking") return -50;
  if (isExplicitSpeakingQuery && skillText === "writing") return -50;

  for (const term of terms) {
    if (tagText.includes(term)) score += 4.0;
    if (topicText.includes(term)) score += 3.5;
    if (partText === term || (partText && term.includes(partText))) score += 3.0;
    if (skillText === term) score += 2.5;
    if (categoryText.includes(term)) score += 2.0;
    if (summaryText.includes(term)) score += 1.5;
    if (contentText.includes(term)) score += 0.5;
  }

  return score;
}

export function retrieveKnowledgeBySkill(skill: string): KnowledgeItem[] {
  const all = loadAllKnowledge();
  const lower = skill.toLowerCase();
  return all.filter((k) => k.skill.toLowerCase() === lower || k.skill.toLowerCase() === "general");
}

export function retrieveKnowledgeByCategory(category: KnowledgeCategory): KnowledgeItem[] {
  const all = loadAllKnowledge();
  return all.filter((k) => k.category === category);
}

export function retrieveKnowledgeBySkillAndPart(skill: string, part: string): KnowledgeItem[] {
  const all = loadAllKnowledge();
  const lowerSkill = skill.toLowerCase();
  const cleanPart = part.toLowerCase().replace(/[^0-9a-z]/g, "");

  return all.filter((k) => {
    const kSkill = k.skill.toLowerCase();
    const matchesSkill = kSkill === lowerSkill || kSkill === "general";
    if (!matchesSkill) return false;

    if (!k.part) return false;
    const kPart = k.part.toLowerCase().replace(/[^0-9a-z]/g, "");
    return kPart === cleanPart || kPart === cleanPart.replace("part", "") || ("part" + kPart) === cleanPart;
  });
}

const APTIS_DOMAIN_ANCHORS = new Set([
  // Skills
  "reading", "listening", "writing", "speaking", "grammar", "vocabulary",
  // Parts
  "part1", "part2", "part3", "part4", "part 1", "part 2", "part 3", "part 4",
  // English Aptis terms
  "email", "formal", "informal", "strategy", "tips", "technique", "present", "perfect",
  "past", "simple", "tenses", "tense", "conditional", "inversion", "relative", "gerund", "infinitive",
  "synonym", "synonyms", "collocation", "collocations", "phrasal", "discourse", "cohesion", "heading",
  "headings", "matching", "monologue", "dialogue", "aptis", "esol", "b2", "ielts",
  "prep", "rubric", "rubrics", "criteria", "distractor", "distractors", "tell", "say", "improve",
  "used", "pronunciation", "fluency", "accent", "time", "score", "pass", "exam", "test",
  // Vietnamese domain keys
  "chiến", "thuật", "mẹo", "luyện", "tập", "bài", "thi", "điểm",
  "ngữ", "pháp", "từ", "vựng", "kỹ", "năng", "đề", "kiểm", "tra",
  "thư", "tranh", "ảnh", "hội", "thoại", "giảng",
  "câu", "điều", "kiện", "đảo", "ngữ", "mệnh", "quan", "hệ",
  "band", "nâng", "cải", "thiện", "lỗi", "thường", "gặp", "sai", "chữa",
  "to-v", "v-ing", "động", "phương", "pháp", "thời gian", "cấu", "trúc", "hỏi", "học", "bí", "quyết",
  "phát", "âm", "trôi", "chảy", "nghe", "đọc", "viết", "nói"
]);

export function retrieveRelevantKnowledge(query: string, maxResults = 3): KnowledgeItem[] {
  const all = loadAllKnowledge();
  if (!query || query.trim().length === 0) return [];

  const terms = expandQueryTerms(query);
  if (terms.length === 0) return [];

  const lowerQuery = query.toLowerCase();
  const triggeredAlias = Object.keys(VI_ALIAS_MAP).some((k) => lowerQuery.includes(k));
  const hasDomainAnchor =
    triggeredAlias || terms.some((t) => APTIS_DOMAIN_ANCHORS.has(t));

  if (!hasDomainAnchor) return [];

  const MIN_SCORE = 2.0;

  const scored = all
    .map((item) => ({ item, score: scoreItem(item, terms, lowerQuery) }))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, maxResults).map((s) => s.item);
  }

  // Graceful fallback: return top scoring items if score > 0
  const anyScored = all
    .map((item) => ({ item, score: scoreItem(item, terms, lowerQuery) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (anyScored.length > 0) {
    return anyScored.slice(0, maxResults).map((s) => s.item);
  }

  // Default fallback to general guidance notes if domain anchor was triggered
  return all.slice(0, maxResults);
}

export function retrieveCrossSkillKnowledge(query: string, maxResults = 4): KnowledgeItem[] {
  const all = loadAllKnowledge();
  const primary = retrieveRelevantKnowledge(query, 2);
  const primaryIds = new Set(primary.map((p) => p.id));

  const lowerQuery = query.toLowerCase();
  const secondary: KnowledgeItem[] = [];

  if (lowerQuery.includes("speaking") || lowerQuery.includes("miêu tả tranh") || lowerQuery.includes("picture")) {
    const grammarVocab = all.filter(
      (k) =>
        (k.tags.includes("present-perfect") ||
          k.tags.includes("collocations") ||
          k.tags.includes("phrasal-verbs")) &&
        !primaryIds.has(k.id)
    );
    if (grammarVocab.length > 0) secondary.push(grammarVocab[0]);
  } else if (lowerQuery.includes("writing") || lowerQuery.includes("email") || lowerQuery.includes("thư")) {
    const connectors = all.filter(
      (k) =>
        (k.tags.includes("conditionals") ||
          k.tags.includes("passive-voice") ||
          k.tags.includes("cohesion")) &&
        !primaryIds.has(k.id)
    );
    if (connectors.length > 0) secondary.push(connectors[0]);
  }

  const combined = [...primary, ...secondary];
  return combined.slice(0, maxResults);
}
