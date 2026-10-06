"use client";

import React from "react";
import {
  Users,
  Calendar as CalendarIcon,
  Mail,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";

export type ActiveTab = "leads" | "calendar" | "mailer" | "analytics";

interface AppSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  leadsCount: number;
  pendingCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  leadsCount,
  pendingCount,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const navItems = [
    {
      id: "leads" as ActiveTab,
      label: "Leads",
      icon: Users,
      badge: leadsCount,
    },
    {
      id: "calendar" as ActiveTab,
      label: "Calendar",
      icon: CalendarIcon,
      badge: undefined,
    },
    {
      id: "mailer" as ActiveTab,
      label: "Email Outreach",
      icon: Mail,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: "analytics" as ActiveTab,
      label: "Analytics",
      icon: BarChart2,
      badge: undefined,
    },
  ];

  return (
    <aside
      className={`bg-zinc-950 border-r border-zinc-800 transition-all duration-200 flex flex-col shrink-0 text-zinc-100 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
              LF
            </div>
            <div className="truncate">
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight truncate">
                LeadFlow AI
              </h1>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            LF
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-indigo-400" : "text-zinc-400"
                }`}
              />

              {!collapsed && (
                <div className="flex-1 text-left flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
