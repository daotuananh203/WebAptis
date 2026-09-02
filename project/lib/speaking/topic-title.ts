export interface SpeakingTopicTitleInput {
  title: string;
  partNumber: number;
  sourceOrder: number | null;
}

/** Preserve raw source headings while making continuation markers readable in UI. */
export function getSpeakingTopicDisplayTitle(topic: SpeakingTopicTitleInput): string {
  if (/^(version\s+\d+\s*:|topic\s+\d+$|hoặc|between these 2 locations)/i.test(topic.title.trim())) {
    const sourceLabel = topic.sourceOrder == null ? "unresolved" : String(topic.sourceOrder).padStart(3, "0");
    return `Speaking Part ${topic.partNumber} · Source topic ${sourceLabel}`;
  }
  return topic.title;
}
