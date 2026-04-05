"use client";

import type { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";

type WoundPageShellProps = {
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function WoundPageShell({ title, description, badge, actions, children }: WoundPageShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4faf8_0%,#ecf3f0_46%,#e1ebe7_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {badge ? (
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                  {badge}
                </span>
              ) : null}
              <h1 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </header>

          <div className="mt-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
