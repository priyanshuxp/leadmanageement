"use client";

import React from "react";
import { Users, Calendar, Mail, BarChart2 } from "lucide-react";
import { ActiveTab } from "@/components/AppSidebar";

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  leadsCount: number;
  pendingCount: number;
}

export function BottomNav({
  activeTab,
  onTabChange,
  leadsCount,
  pendingCount,
}: BottomNavProps) {
  const tabs = [
    {
      id: "leads" as ActiveTab,
      label: "Leads",
      icon: Users,
      badge: leadsCount,
    },
    {
      id: "calendar" as ActiveTab,
      label: "Calendar",
      icon: Calendar,
      badge: undefined,
    },
    {
      id: "mailer" as ActiveTab,
      label: "Outreach",
      icon: Mail,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: "bg-amber-500 text-zinc-950",
    },
    {
      id: "analytics" as ActiveTab,
      label: "Insights",
      icon: BarChart2,
      badge: undefined,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/90 pb-2">
      <div className="grid grid-cols-4 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-zinc-400"}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[9px] font-bold px-1 rounded-full ${
                      tab.badgeColor || "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? "font-semibold text-zinc-100" : "font-medium"}`}>
                {tab.label}
              </span>

              {isActive && (
                <div className="absolute top-0 inset-x-4 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
