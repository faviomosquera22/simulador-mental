"use client";

import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";

const NavigationPreferences = createContext<{ collapsed: boolean; setCollapsed: Dispatch<SetStateAction<boolean>> } | null>(null);

/** The root provider survives navigation; the sidebar never changes width on its own. */
export function NavigationPreferencesProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <NavigationPreferences.Provider value={{ collapsed, setCollapsed }}>{children}</NavigationPreferences.Provider>;
}
export function useNavigationPreferences() {
  const context = useContext(NavigationPreferences);
  if (!context) throw new Error("NavigationPreferencesProvider is required");
  return context;
}
