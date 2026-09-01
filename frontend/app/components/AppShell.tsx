"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type AppShellProps = {
  children: ReactNode;
};

type UserRole = "Storeman" | "Manager" | "Admin";

type TestUser = {
  userId: number;
  employeeNumber: string | null;
  displayName: string;
  emailAddress: string;
  role: UserRole;
  isActive: boolean;
};

const API_BASE_URL = "http://localhost:5178";
const STORAGE_KEY = "toolstore-test-user-id";

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [users, setUsers] = useState<TestUser[]>([]);
  const [currentUser, setCurrentUser] = useState<TestUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ============================================================
  // LOAD ACTIVE TEST USERS
  // ============================================================

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUser(true);

        const response = await fetch(`${API_BASE_URL}/api/users`);

        if (!response.ok) {
          throw new Error("Unable to load test users.");
        }

        const data: TestUser[] = await response.json();

        setUsers(data);

        if (data.length === 0) {
          setCurrentUser(null);
          return;
        }

        const storedUserId = localStorage.getItem(STORAGE_KEY);

        const storedUser = storedUserId
          ? data.find(
              (user) => user.userId === Number(storedUserId)
            )
          : null;

        if (storedUser) {
          setCurrentUser(storedUser);
        } else {
          setCurrentUser(data[0]);
          localStorage.setItem(
            STORAGE_KEY,
            data[0].userId.toString()
          );
        }
      } catch (error) {
        console.error(error);
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUsers();
  }, []);

  // ============================================================
  // ROLE ACCESS
  // ============================================================

  const isStoreman = currentUser?.role === "Storeman";

  const canViewDashboard =
    currentUser?.role === "Manager" ||
    currentUser?.role === "Admin";

  const canViewAdministration =
    currentUser?.role === "Manager" ||
    currentUser?.role === "Admin";

  // ============================================================
  // REDIRECT USERS FROM RESTRICTED PAGES
  // ============================================================

  useEffect(() => {
    if (loadingUser || !currentUser) {
      return;
    }

    if (isStoreman) {
      if (
        pathname === "/" ||
        pathname.startsWith("/administration")
      ) {
        router.replace("/tool-transactions");
      }
    }
  }, [
    currentUser,
    isStoreman,
    loadingUser,
    pathname,
    router,
  ]);

  // ============================================================
  // SWITCH TEST USER
  // ============================================================

  function switchUser(user: TestUser) {
    setCurrentUser(user);

    localStorage.setItem(
      STORAGE_KEY,
      user.userId.toString()
    );

    setShowUserMenu(false);

    // If the new user is a Storeman and is currently on
    // a restricted page, move them to Tool Transactions.
    if (
      user.role === "Storeman" &&
      (
        pathname === "/" ||
        pathname.startsWith("/administration")
      )
    ) {
      router.replace("/tool-transactions");
      return;
    }

    router.refresh();
  }

  // ============================================================
  // NAVIGATION STYLE
  // ============================================================

  function navClass(path: string) {
    const isActive = pathname === path;

    return isActive
      ? "relative mb-2 flex w-full items-center gap-3 rounded-lg bg-[#f1f4f8] px-3 py-3 text-left text-[14px] font-semibold text-[#17356d]"
      : "mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] font-semibold text-[#17213c] hover:bg-[#f5f7fa]";
  }

  // ============================================================
  // USER INITIALS
  // ============================================================

  function getInitials(name: string) {
    const parts = name
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length === 0) {
      return "TS";
    }

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#10204a]">
      <div className="flex min-h-screen">

        {/* LEFT SIDEBAR */}
        <aside className="flex w-[230px] shrink-0 flex-col border-r border-[#dfe5ee] bg-white">

          {/* LOGO */}
          <div className="flex h-[128px] items-center justify-center border-b border-white/10 bg-[#08285a] px-5">
            <img
              src="/namdock-logo.png"
              alt="NAMDOCK"
              className="max-h-[88px] w-[150px] object-contain"
            />
          </div>

          {/* TOOL STORE */}
          <div className="flex items-center gap-3 border-b border-[#e4e9f0] px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5C932] text-xs font-bold text-[#213767]">
              TS
            </div>

            <div>
              <p className="text-[14px] font-bold text-[#101d3c]">
                Tool Store
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.13em] text-[#697895]">
                Test Environment
              </p>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-4">

            {/* DASHBOARD - MANAGER / ADMIN ONLY */}
            {canViewDashboard && (
              <Link href="/" className={navClass("/")}>
                {pathname === "/" && (
                  <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[#F5C932]" />
                )}

                <span className="flex h-5 w-5 items-center justify-center">
                  ▦
                </span>

                Dashboard
              </Link>
            )}

            {/* ALL ROLES */}
            <Link
              href="/tool-transactions"
              className={navClass("/tool-transactions")}
            >
              {pathname === "/tool-transactions" && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[#F5C932]" />
              )}

              <span className="flex h-5 w-5 items-center justify-center">
                ↔
              </span>

              Tool Transactions
            </Link>

            {/* ALL ROLES */}
            <Link
              href="/tool-register"
              className={navClass("/tool-register")}
            >
              {pathname === "/tool-register" && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[#F5C932]" />
              )}

              <span className="flex h-5 w-5 items-center justify-center">
                🔧
              </span>

              Tool Register
            </Link>

            {/* MANAGER / ADMIN ONLY */}
            {canViewAdministration && (
              <>
                <div className="mb-4 mt-4 border-t border-[#e1e6ed]" />

                <Link
                  href="/administration"
                  className={navClass("/administration")}
                >
                  {pathname === "/administration" && (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[#F5C932]" />
                  )}

                  <span className="flex h-5 w-5 items-center justify-center">
                    ⚙
                  </span>

                  Administration
                </Link>
              </>
            )}
          </nav>

          {/* TEST USER */}
          <div className="relative border-t border-[#e1e6ed] px-4 py-4">

            {/* USER SWITCHER POPUP */}
            {showUserMenu && (
              <div className="absolute bottom-[76px] left-3 right-3 z-50 overflow-hidden rounded-lg border border-[#d9e0e9] bg-white shadow-xl">

                <div className="border-b border-[#e4e9f0] bg-[#f7f9fc] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#65728a]">
                    Switch Test User
                  </p>
                </div>

                <div className="max-h-[260px] overflow-y-auto">
                  {users.map((user) => {
                    const selected =
                      currentUser?.userId === user.userId;

                    return (
                      <button
                        key={user.userId}
                        onClick={() => switchUser(user)}
                        className={`flex w-full items-center gap-3 border-b border-[#edf0f4] px-3 py-3 text-left last:border-b-0 ${
                          selected
                            ? "bg-[#f1f4f8]"
                            : "bg-white hover:bg-[#f7f9fc]"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#08285a] text-[10px] font-semibold text-white">
                          {getInitials(user.displayName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-[#17213c]">
                            {user.displayName}
                          </p>

                          <p className="mt-0.5 text-[9px] text-[#65728a]">
                            {user.role}
                          </p>
                        </div>

                        {selected && (
                          <span className="text-[12px] font-bold text-green-600">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#e4e9f0] bg-[#fff9df] px-3 py-2">
                  <p className="text-[9px] leading-4 text-[#715c00]">
                    Test environment only
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() =>
                setShowUserMenu((previous) => !previous)
              }
              disabled={loadingUser || users.length === 0}
              className="flex w-full items-center justify-between rounded-lg p-1 text-left hover:bg-[#f5f7fa] disabled:cursor-default"
            >
              <div className="flex min-w-0 items-center gap-2.5">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#08285a] text-xs font-semibold text-white">
                  {currentUser
                    ? getInitials(currentUser.displayName)
                    : "TS"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[#17213c]">
                    {loadingUser
                      ? "Loading..."
                      : currentUser?.displayName ??
                        "No active user"}
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#65728a]">
                    {currentUser?.role ?? "Tool Store"}
                  </p>
                </div>
              </div>

              <span className="text-base text-[#17213c]">
                {showUserMenu ? "⌃" : "⌄"}
              </span>
            </button>
          </div>
        </aside>

        {/* RIGHT AREA */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* TOP BAR */}
          <header className="relative flex h-[72px] items-center justify-center bg-[#08285a] px-6">
            <h1 className="text-center text-[18px] font-bold tracking-[0.01em] text-white">
              Tool Store Management System
            </h1>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1">
            {children}
          </main>

          {/* FOOTER */}
          <footer className="flex h-[44px] items-center justify-between border-t border-[#dfe5ed] bg-white px-6 text-[10px] font-medium text-[#52627c]">
            <span>NAMDOCK Tool Store Management System</span>
            <span>v1.0.0</span>
          </footer>

        </div>
      </div>
    </div>
  );
}