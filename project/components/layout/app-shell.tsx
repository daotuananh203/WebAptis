"use client";

import * as React from "react";
import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { Breadcrumbs, BreadcrumbItem } from "./breadcrumbs";
import { LexiChatButton } from "./lexi-chat-button";

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  headerTitle?: string;
  headerDescription?: string;
  currentStreak?: number;
  isActiveToday?: boolean;
}

export function AppShell({
  children,
  breadcrumbs,
  headerTitle,
  headerDescription,
}: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleToggleSidebar = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Universal TopBar */}
      <TopBar onToggleSidebar={handleToggleSidebar} />

      <div className="flex-1 flex overflow-x-hidden">
        {/* 2. Universal Dark Sidebar */}
        <Sidebar
          isOpen={isMobileOpen}
          isCollapsed={isCollapsed}
          onClose={() => setIsMobileOpen(false)}
        />

        {/* 3. Main Application Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
            isCollapsed ? "md:pl-16" : "md:pl-64"
          }`}
        >
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
            {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

            {(headerTitle || headerDescription) && (
              <div className="mb-6 space-y-1">
                {headerTitle && (
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {headerTitle}
                  </h1>
                )}
                {headerDescription && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {headerDescription}
                  </p>
                )}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>

      {/* 4. Floating Lexi Chatbot Button */}
      <LexiChatButton />
    </div>
  );
}
