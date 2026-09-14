import { Aperture } from "lucide-react";
import Link from "next/link";
import ThemeToggleButton from "../ThemeToggleButton";

const Header = () => {
  return (
    <header
      className="glass-bar fixed top-0 right-0 left-0 z-40 border-x-0 border-t-0"
      aria-label="app-header">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={"/"}
          className="flex items-center gap-3">
          <span className="bg-success/15 text-success ring-line-subtle grid size-9 shrink-0 place-items-center rounded-full ring-1">
            <Aperture size={20} />
          </span>

          <span className="leading-none">
            <h1
              className="font-display text-[17px] font-semibold"
              aria-label="App Name">
              Astro Lens
            </h1>

            <span className="text-muted-foreground mt-1 block text-[11px] font-medium tracking-wide">
              Private photo vault
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href={"/"}
            className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] rounded-full px-4 py-1.5 text-sm font-medium ring-1 backdrop-blur transition">
            Home
          </Link>

          <ThemeToggleButton />
        </nav>
      </div>
    </header>
  );
};

export default Header;
