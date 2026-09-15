"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  setIsOpen: () => {},
  toggleSidebar: () => {},
});

export const SidebarToggleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Default to true on desktop, false on mobile
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("astrolens-sidebar-open");
      if (saved !== null) {
        setIsOpen(saved === "true");
      } else if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    } catch {
      // Ignore local storage errors
    }

    // Ctrl+B / Cmd+B shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          try {
            localStorage.setItem("astrolens-sidebar-open", String(next));
          } catch {}
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("astrolens-sidebar-open", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarToggle = () => useContext(SidebarContext);
