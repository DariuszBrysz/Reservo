/**
 * Main application header with navigation
 *
 * Features:
 * - Logo linking to homepage
 * - Primary navigation (Facilities, My Reservations)
 * - Fully keyboard accessible with ARIA labels
 */
interface HeaderProps {
  currentPath: string;
}

export function Header({ currentPath }: HeaderProps) {
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
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-border/40 px-4 py-2" aria-label="Mobile navigation">
        <div className="flex items-center justify-around">
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
      </nav>
    </header>
  );
}
