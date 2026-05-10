"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Feed", description: "Your daily papers", icon: "home" },
  { href: "/explore", label: "Explore", description: "Swipe through papers", icon: "play" },
  { href: "/discover", label: "Discover", description: "Search all papers", icon: "search" },
  { href: "/streak", label: "Streak", description: "Track your progress", icon: "flame" },
  { href: "/profile", label: "Profile", description: "Settings & saved", icon: "user" },
];

function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const paths: Record<string, string> = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    flame: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[icon]} />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar — expands on hover */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-16 hover:w-52 flex-col py-6 border-r border-border bg-paper z-50 transition-all duration-300 ease-in-out overflow-hidden group/nav">
        <Link href="/dashboard" className="mb-6 px-5 flex items-center gap-3">
          <span className="font-serif text-xl font-bold text-accent flex-shrink-0">L</span>
          <span className="font-serif text-lg font-bold text-accent opacity-0 group-hover/nav:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Lexon
          </span>
        </Link>

        <div className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all duration-200",
                  isActive ? "bg-accent/10 text-accent" : "text-muted hover:text-ink hover:bg-ink/5"
                )}
              >
                <NavIcon icon={item.icon} className="flex-shrink-0" />
                <div className="opacity-0 group-hover/nav:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                  <span className="text-sm font-medium block">{item.label}</span>
                  <span className="text-[11px] text-muted block">{item.description}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto px-5">
          <UserButton />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 border-t border-border bg-paper/95 backdrop-blur-sm z-50">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                isActive ? "text-accent" : "text-muted"
              )}
            >
              <NavIcon icon={item.icon} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
