import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rawMode = params.mode;
  const mode = rawMode === "evaluation" ? "evaluation" : "tutor";

  redirect(`/simulators/wound-care/lpp/cases?mode=${mode}`);
}
