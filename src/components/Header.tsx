/**
 * Main application header with navigation
 *
 * Features:
 * - Logo linking to homepage
 * - Primary navigation (Facilities, My Reservations)
 * - Authentication UI (Login/Register or User menu with Logout)
 * - Fully keyboard accessible with ARIA labels
 */

import { useState } from "react";
import { Button } from "./ui/button";

interface HeaderProps {
  currentPath: string;
  userEmail?: string | null;
  userRole?: string | null;
}

export function Header({ currentPath, userEmail, userRole }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        setIsLoggingOut(false);
      }
    } catch {
      setIsLoggingOut(false);
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <a
            href="/"
            className="flex items-center gap-2 text-lg font-semibold hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label="Reservo - Go to homepage"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Reservo</span>
          </a>

          {/* Primary Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            <a
              href="/"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1 ${
                currentPath === "/" ? "text-foreground" : "text-foreground/60"
              }`}
              aria-current={currentPath === "/" ? "page" : undefined}
            >
              Facilities
            </a>
            <a
              href="/my-reservations"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1 ${
                currentPath === "/my-reservations" ? "text-foreground" : "text-foreground/60"
              }`}
              aria-current={currentPath === "/my-reservations" ? "page" : undefined}
            >
              My Reservations
            </a>
          </nav>
        </div>

        {/* Authentication UI */}
        <div className="hidden md:flex items-center gap-3">
          {userEmail ? (
            // Authenticated State - User Menu
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onBlur={(e) => {
                  // Close menu if clicking outside
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setTimeout(() => setIsUserMenuOpen(false), 200);
                  }
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col items-start">
                  <span className="max-w-[150px] truncate">{userEmail}</span>
                  {userRole === "admin" && (
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Admin</span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg z-50">
                  <div className="p-2 space-y-1">
                    <a
                      href="/update-password"
                      className="block px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Update Password
                    </a>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Unauthenticated State - Login/Register Buttons
            <>
              <Button asChild variant="ghost" size="sm">
                <a href="/login">Login</a>
              </Button>
              <Button asChild size="sm">
                <a href="/register">Register</a>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-border/40 px-4 py-2" aria-label="Mobile navigation">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href="/"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-3 py-2 ${
                currentPath === "/" ? "text-foreground" : "text-foreground/60"
              }`}
              aria-current={currentPath === "/" ? "page" : undefined}
            >
              Facilities
            </a>
            <a
              href="/my-reservations"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-3 py-2 ${
                currentPath === "/my-reservations" ? "text-foreground" : "text-foreground/60"
              }`}
              aria-current={currentPath === "/my-reservations" ? "page" : undefined}
            >
              My Reservations
            </a>
          </div>

          {/* Mobile Authentication UI */}
          <div className="flex items-center gap-2">
            {userEmail ? (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-sm font-medium text-foreground/60 hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-3 py-2 disabled:opacity-50"
              >
                {isLoggingOut ? "..." : "Logout"}
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm font-medium text-foreground/60 hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-3 py-2"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-3 py-2 bg-primary text-primary-foreground"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
