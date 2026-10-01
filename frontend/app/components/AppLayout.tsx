"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppShell from "./AppShell";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Login page must not display the application shell.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}