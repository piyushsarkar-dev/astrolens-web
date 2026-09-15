"use client";

import { Search, X } from "lucide-react";
import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const SEARCHABLE_HINT = [
  "filename",
  "custom name",
  "date",
  "album",
  "metadata",
  "location",
];

export type SearchBarProps = {
  /** Controlled search query. */
  value: string;
  /** Called with the new query string whenever the user types or clears. */
  onChange: (value: string) => void;
  /** Number of images that match the current query. */
  resultCount: number;
  /** Total number of images in the current view (before search). */
  totalCount: number;
  /** Placeholder text. */
  placeholder?: string;
  /** Additional CSS classes. */
  className?: string;
};

const SearchBar = ({
  value,
  onChange,
  resultCount,
  totalCount,
  placeholder = "Search photos…",
  className,
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const hasNoResults = hasValue && resultCount === 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value);

  const handleClear = () => onChange("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onChange("");
    }
  };

    const handleFocus = () => setIsFocused(true);

  // Delay hiding the hint slightly so users can read it after tabbing away.
  const handleBlur = () => setTimeout(() => setIsFocused(false), 120);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* ── Search input ─────────────────────────────────────────────── */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search
            size={16}
            className="text-mist"
          />
        </div>

        <input
          type="search"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "peer border-border w-full rounded-xl border",
            "bg-foreground/[0.04] py-2.5 pr-10 pl-10 text-sm",
            "text-foreground placeholder:text-mist/50",
            "focus:ring-sky/40 focus:ring-2 focus:outline-none",
            "backdrop-blur transition-all duration-200",
          )}
        />

        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute inset-y-0 right-0 flex items-center pr-2",
              "text-mist hover:text-foreground transition-colors",
            )}
            aria-label="Clear search"
            title="Clear search"
            tabIndex={-1}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Hint (visible on focus, when empty) ─────────────────────── */}
      {!hasValue && isFocused && (
        <p className="text-mist/60 text-xs">
          Search by{" "}
          {SEARCHABLE_HINT.map((field, i) => (
            <span
              key={field}
              className="text-mist/40">
              {field}
              {i < SEARCHABLE_HINT.length - 1 && ", "}
            </span>
          ))}
          .
        </p>
      )}

      {/* ── Result count ─────────────────────────────────────────────── */}
      <div className="text-mist flex items-center justify-between text-xs">
        <span>
          {hasValue ?
            hasNoResults ?
              "No photos match your search"
            : `${resultCount} photo${resultCount === 1 ? "" : "s"} found`
          : `${totalCount} photo${totalCount === 1 ? "" : "s"} in view`}
        </span>

        {hasValue && !hasNoResults && totalCount !== resultCount && (
          <span className="text-mist/50">filtered from {totalCount}</span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
