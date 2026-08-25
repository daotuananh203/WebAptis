import * as React from "react";
import Link from "next/link";
import {
  BookA,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ExamComponentSkill, SkillPerformanceMetric } from "@/lib/progress/types";

export interface SkillCardsProps {
  metrics: Record<ExamComponentSkill, SkillPerformanceMetric>;
}

interface SkillConfig {
  skill: ExamComponentSkill;
  title: string;
  officialDuration: string;
  icon: typeof BookA;
  colorClass: string;
  href: string;
}

const SKILL_CONFIGS: SkillConfig[] = [
  {
    skill: "grammarVocabulary",
    title: "Grammar & Vocabulary",
    officialDuration: "25 phút • 50 câu",
    icon: BookA,
    colorClass: "bg-purple-50 text-purple-600 border-purple-100",
    href: "/practice?skill=grammarVocabulary",
  },
  {
    skill: "reading",
    title: "Reading",
    officialDuration: "35 phút • 4 phần",
    icon: BookOpen,
    colorClass: "bg-blue-50 text-blue-600 border-blue-100",
    href: "/practice?skill=reading",
  },
  {
    skill: "listening",
    title: "Listening",
    officialDuration: "40 phút • 4 phần",
    icon: Headphones,
    colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    href: "/practice?skill=listening",
  },
  {
    skill: "writing",
    title: "Writing",
    officialDuration: "50 phút • 4 phần",
    icon: PenTool,
    colorClass: "bg-amber-50 text-amber-600 border-amber-100",
    href: "/practice?skill=writing",
  },
  {
    skill: "speaking",
    title: "Speaking",
    officialDuration: "12 phút • 4 phần",
    icon: Mic,
    colorClass: "bg-rose-50 text-rose-600 border-rose-100",
    href: "/practice?skill=speaking",
  },
];

export function SkillCards({ metrics }: SkillCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {SKILL_CONFIGS.map((cfg) => {
        const metric = metrics[cfg.skill];
        const Icon = cfg.icon;
        const hasAttempts = metric.totalAttempts > 0;

        return (
          <Card
            key={cfg.skill}
            className="border-slate-200 hover:border-slate-300 transition-all hover:shadow-xs flex flex-col justify-between"
          >
            <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Icon & Duration */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${cfg.colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {hasAttempts ? (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      {metric.improvementTrend === "improving" && (
                        <span className="flex items-center text-emerald-600 font-semibold gap-0.5">
                          <TrendingUp className="h-3.5 w-3.5" /> Tăng
                        </span>
                      )}
                      {metric.improvementTrend === "declining" && (
                        <span className="flex items-center text-red-600 font-semibold gap-0.5">
                          <TrendingDown className="h-3.5 w-3.5" /> Giảm
                        </span>
                      )}
                      {metric.improvementTrend === "stable" && (
                        <span className="flex items-center text-slate-400 gap-0.5">
                          <Minus className="h-3.5 w-3.5" /> Ổn định
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-400">
                      Chưa làm
                    </Badge>
                  )}
                </div>

                {/* Title & Stats */}
                <h3 className="font-bold text-slate-900 text-sm leading-tight">
                  {cfg.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {cfg.officialDuration}
                </p>

                {/* Accuracy Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Độ chính xác</span>
                    <span className={hasAttempts ? "text-slate-900" : "text-slate-400"}>
                      {hasAttempts ? `${metric.averagePercentage}%` : "—"}
                    </span>
                  </div>
                  <Progress
                    value={metric.averagePercentage}
                    className="h-2"
                    indicatorClassName={
                      metric.averagePercentage >= 75
                        ? "bg-emerald-500"
                        : metric.averagePercentage >= 55
                        ? "bg-blue-600"
                        : "bg-amber-500"
                    }
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{metric.totalAttempts} bài đã làm</span>
                    {hasAttempts && <span>Cao nhất: {metric.highestPercentage}%</span>}
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <Link href={cfg.href} className="mt-4 pt-3 border-t border-slate-100 block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/70 h-9 px-3 rounded-lg transition-all active:scale-[0.98]"
                >
                  <span>Luyện tập ngay</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
