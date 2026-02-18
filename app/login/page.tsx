"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export default function CasesPage() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!alive) return;
        setUserEmail(data.user?.email ?? "");
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  return (
    <main className="p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Biblioteca de casos</h1>
          <p className="mt-1 text-sm text-white/70">
            {userEmail ? `Sesión activa: ${userEmail}` : "Sesión activa"}
          </p>
        </div>

        <button
          onClick={onLogout}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10"
          title="Cerrar sesión"
        >
          Cerrar sesión
        </button>
      </div>

      {/* The rest of the cases grid/list goes here */}
    </main>
  );
}