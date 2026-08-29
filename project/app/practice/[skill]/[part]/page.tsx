import { AppShell } from "@/components/layout/app-shell";
import { PracticeShell } from "@/components/practice/practice-shell";
import { formatTestDisplayName } from "@/lib/exam/test-catalog";

const SKILL_NAMES: Record<string, string> = {
  grammarVocabulary: "Ngữ pháp & Từ vựng",
  reading: "Đọc",
  listening: "Nghe",
  writing: "Viết",
  speaking: "Nói",
};

export default async function PracticePartPage({
  params,
  searchParams,
}: {
  params: Promise<{ skill: string; part: string }>;
  searchParams?: Promise<{ testId?: string; bank?: string; itemId?: string }>;
}) {
  const { skill, part } = await params;
  const sParams = await searchParams;
  const testId = sParams?.testId || "aptis-b2-01";
  const practiceBank = skill === "speaking" && sParams?.bank === "canonical";
  const practiceItemId = practiceBank ? sParams?.itemId : undefined;
  const skillDisplayName = SKILL_NAMES[skill] || skill;
  const testDisplayName = practiceBank ? "Canonical Speaking Practice Bank" : formatTestDisplayName(testId);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Luyện tập Aptis", href: "/practice" },
        { label: skillDisplayName, href: `/practice?skill=${skill}` },
        { label: `${part.toUpperCase()} — ${testDisplayName}` },
      ]}
      headerTitle={`Luyện ${skillDisplayName} — ${part.toUpperCase()}`}
      headerDescription={practiceBank
        ? `Luyện độc lập từ Practice Bank nguồn. Chọn đúng topic, ghi âm và nộp bài để xem phản hồi AI.`
        : `Đang làm bài: ${testDisplayName}. Hoàn thành các câu hỏi và nộp bài để xem điểm số tức thì.`}
    >
      <PracticeShell skill={skill} partIdentifier={part} testId={testId} practiceBank={practiceBank} practiceItemId={practiceItemId} />
    </AppShell>
  );
}
