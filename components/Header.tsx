"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, BarChart3, Users, Settings, Zap, Sun, Moon, LogIn, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useWorkspace } from "./WorkspaceProvider";

interface HeaderProps {
  onOpenSettings?: () => void;
}

const NAV_ITEMS = [
  { href: "/history", label: "History", icon: History },
  { href: "/usage", label: "Usage", icon: BarChart3 },
  { href: "/workspaces", label: "Teams", icon: Users },
] as const;

export function Header({ onOpenSettings }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const {
    activeWorkspaceId,
    workspaces,
    pendingInvitations,
    setActiveWorkspace,
  } = useWorkspace();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="header-shell">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 md:gap-4 md:px-6">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-accent/25 bg-accent-muted shadow-[0_0_18px_rgba(34,197,94,0.1)] transition-shadow duration-200 group-hover:shadow-[0_0_22px_rgba(34,197,94,0.18)]"
            aria-hidden
          >
            <Zap className="h-[18px] w-[18px] text-accent" />
          </span>
          <span className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              Master Prompt
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-fg">
              Prompt architect
            </span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <nav className="header-nav-pill max-w-full overflow-x-auto" aria-label="Main">
            {session?.user && workspaces.length > 0 && (
              <div className="relative hidden sm:block">
                <label className="sr-only" htmlFor="workspace-select">
                  Active workspace
                </label>
                <div className="relative">
                  <select
                    id="workspace-select"
                    value={activeWorkspaceId ?? ""}
                    onChange={(e) => setActiveWorkspace(e.target.value || null)}
                    className="header-nav-link cursor-pointer appearance-none pr-7 !text-xs"
                  >
                    <option value="">Personal</option>
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-fg"
                    aria-hidden
                  />
                </div>
              </div>
            )}
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`header-nav-link cursor-pointer ${active ? "header-nav-link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden md:inline">{label}</span>
                  <span className="sr-only md:hidden">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="header-utilities shrink-0">
        {!session?.user ? (
          <Link href="/login?callbackUrl=/workspaces" className="header-sign-in cursor-pointer" aria-label="Sign in">
                <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            ) : (
              <Link
                href="/workspaces"
                className="header-avatar relative cursor-pointer"
                aria-label={`Signed in as ${session.user.name ?? session.user.email}`}
                title={session.user.name ?? session.user.email ?? "Account"}
              >
                {pendingInvitations.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-[#052e16]">
                    {pendingInvitations.length}
                  </span>
                )}
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-accent">
                    {(session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={toggle}
              className="header-icon-btn cursor-pointer"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => onOpenSettings?.()}
              className="header-icon-btn cursor-pointer"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
