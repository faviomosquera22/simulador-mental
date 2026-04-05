"use client";

type StageClassificationCardProps = {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

export default function StageClassificationCard({
  label,
  description,
  selected,
  onSelect,
}: StageClassificationCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[22px] border p-4 text-left transition ${
        selected ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-2 text-xs leading-5">{description}</div>
    </button>
  );
}
