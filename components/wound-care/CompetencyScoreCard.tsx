"use client";

type CompetencyScoreCardProps = {
  title: string;
  score: number;
  feedback: string;
};

export default function CompetencyScoreCard({ title, score, feedback }: CompetencyScoreCardProps) {
  const tone =
    score >= 85
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : score >= 70
      ? "border-cyan-200 bg-cyan-50 text-cyan-900"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <article className={`rounded-[24px] border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-lg font-semibold">{score}</div>
      </div>
      <p className="mt-3 text-sm leading-6">{feedback}</p>
    </article>
  );
}
