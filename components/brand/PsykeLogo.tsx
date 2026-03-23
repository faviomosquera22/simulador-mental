type PsykeLogoProps = {
  className?: string;
  compact?: boolean;
  markOnly?: boolean;
  showTagline?: boolean;
  tone?: "default" | "inverse";
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function BrandDots({ tone }: { tone: PsykeLogoProps["tone"] }) {
  const leftDot = tone === "inverse" ? "bg-[#8fb2bb]" : "bg-[#6f95a0]";
  const rightDot = tone === "inverse" ? "bg-[#9dc1b4]" : "bg-[#7ea796]";

  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span className={cn("h-2.5 w-2.5 rounded-full", leftDot)} />
      <span className={cn("h-2.5 w-2.5 rounded-full", rightDot)} />
    </span>
  );
}

function PsykeMark({
  className,
  tone,
}: {
  className?: string;
  tone: PsykeLogoProps["tone"];
}) {
  const stroke = tone === "inverse" ? "#a5c6bf" : "#8db4ad";

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M27 17C17 24 12 38 12 53v19h17l8 13 8-37 11 37 7-13h20V53c0-15-5-29-15-36"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PsykeLogo({
  className,
  compact = false,
  markOnly = false,
  showTagline = true,
  tone = "default",
}: PsykeLogoProps) {
  const inkClass = tone === "inverse" ? "text-[#f5fbf9]" : "text-[#171a22]";
  const subClass = tone === "inverse" ? "text-[#c8d8d4]" : "text-[#536c78]";
  const ruleClass = tone === "inverse" ? "bg-white/18" : "bg-[#1b2130]/14";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3",
        compact ? "gap-2.5" : "gap-4",
        className
      )}
      aria-label="Psyke"
    >
      <PsykeMark
        tone={tone}
        className={compact ? "h-10 w-10 shrink-0" : "h-14 w-14 shrink-0"}
      />

      {!markOnly && (
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {!compact && <BrandDots tone={tone} />}
            <span
              className={cn(
                "truncate font-black uppercase leading-none tracking-[0.22em]",
                inkClass,
                compact ? "text-[1.05rem]" : "text-[1.9rem]"
              )}
            >
              Psyke
            </span>
            <BrandDots tone={tone} />
          </div>

          {showTagline && (
            <div className="mt-1.5">
              <div className={cn("h-px w-full", ruleClass)} />
              <div
                className={cn(
                  "pt-1.5 text-[0.62rem] font-medium uppercase tracking-[0.4em]",
                  subClass
                )}
              >
                Simulador clinico
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
