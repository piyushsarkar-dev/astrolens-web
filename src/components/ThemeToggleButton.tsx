"use client";

import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] grid size-9 cursor-pointer place-items-center rounded-full ring-1 backdrop-blur transition">
      <Sun
        size={18}
        className="-rotate-90 opacity-100 transition-all duration-300 dark:rotate-0 dark:opacity-0"
      />

      <MoonStar
        size={18}
        className="absolute -rotate-90 opacity-0 transition-all duration-300 dark:rotate-0 dark:opacity-100"
      />
    </button>
  );
};

export default ThemeToggleButton;
