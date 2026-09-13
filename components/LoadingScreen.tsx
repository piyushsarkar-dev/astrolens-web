'use client';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-ink-600 border-t-lime animate-spin" />
        <p className="text-ink-200 text-sm tracking-wide">Loading Lumen Vault…</p>
      </div>
    </div>
  );
}
