import { ExamShell } from "@/components/mock-test/exam-shell";

export default async function MockTestSessionPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return <ExamShell testId={testId} />;
}
