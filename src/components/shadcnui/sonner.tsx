"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * shadcn/ui toast surface (Sonner-based).
 * All app notifications (errors, success, warnings) render here — pinned to
 * the bottom-right corner, theme-aware, with a close button.
 */
const Toaster = (props: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      richColors
      closeButton
      expand={false}
      duration={6000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "font-sans !rounded-2xl",
          title: "text-sm font-semibold",
          description: "text-sm",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
