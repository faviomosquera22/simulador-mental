"use client";

import Link from "next/link";

type WoundCareModuleCardProps = {
  title: string;
  description: string;
  badge?: string;
  href: string;
  ctaLabel?: string;
  metrics?: string[];
};

export default function WoundCareModuleCard({
  title,
  description,
  badge,
  href,
  ctaLabel = "Ingresar",
  metrics = [],
}: WoundCareModuleCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          {badge ? (
            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
              {badge}
            </span>
          ) : null}
          <div className="mt-3 text-xl font-semibold text-slate-900">{title}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top,#d9ece8,transparent_60%)] p-4 text-slate-500">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 5h12" />
            <path d="M8 5v5l-3 5a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 15l-3-5V5" />
            <path d="M9 11h6" />
            <path d="M10 14h4" />
          </svg>
        </div>
      </div>

      {metrics.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <span key={metric} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {metric}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        <Link
          href={href}
          className="inline-flex rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
