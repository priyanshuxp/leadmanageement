"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventDropdown } from "@/components/ui/EventDropdown";
import { StatusDropdown } from "@/components/ui/StatusDropdown";
import { STATUS_CONFIG } from "@/components/ui/StatusPicker";
import { LeadStatus } from "@/lib/api";

export const STATUS_OPTIONS: {
  label: string;
  value: string;
  colorClass: string;
  activeClass: string;
}[] = [
  {
    label: "All",
    value: "ALL",
    colorClass: "text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border-zinc-800",
    activeClass: "bg-zinc-100 text-zinc-900 font-semibold border-zinc-100",
  },
  {
    label: "Pending",
    value: "PENDING",
    colorClass: "text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border-amber-900/60",
    activeClass: "bg-amber-500 text-zinc-950 font-semibold border-amber-400",
  },
  {
    label: "Contacted",
    value: "CONTACTED",
    colorClass: "text-blue-300 bg-blue-950/40 hover:bg-blue-950/70 border-blue-900/60",
    activeClass: "bg-blue-600 text-white font-semibold border-blue-500",
  },
  {
    label: "Booked",
    value: "BOOKED",
    colorClass: "text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border-emerald-900/60",
    activeClass: "bg-emerald-600 text-white font-semibold border-emerald-500",
  },
  {
    label: "Closed",
    value: "CLOSED",
    colorClass: "text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border-zinc-800",
    activeClass: "bg-zinc-700 text-white font-semibold border-zinc-600",
  },
  {
    label: "Not Interested",
    value: "NOT_INTERESTED",
    colorClass: "text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border-rose-900/60",
    activeClass: "bg-rose-600 text-white font-semibold border-rose-500",
  },
];

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedEvent: string;
  onEventChange: (event: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  events: string[];
  countsByStatus?: Record<string, number>;
  totalCount?: number;
  // Selected rows action props
  selectedCount?: number;
  onApplyBulkStatus?: (status: LeadStatus) => void;
  onClearSelection?: () => void;
}

export function Filters({
  searchQuery,
  onSearchChange,
  selectedEvent,
  onEventChange,
  selectedStatus,
  onStatusChange,
  events,
  countsByStatus = {},
  totalCount,
  selectedCount = 0,
  onApplyBulkStatus,
  onClearSelection,
}: FiltersProps) {
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    searchQuery !== "" || selectedEvent !== "all" || selectedStatus !== "ALL";

  const clearAllFilters = () => {
    onSearchChange("");
    onEventChange("all");
    onStatusChange("ALL");
  };

  const allStatuses: LeadStatus[] = [
    "PENDING",
    "CONTACTED",
    "BOOKED",
    "CLOSED",
    "NOT_INTERESTED",
  ];

  // Close action menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left side: Search input + Dynamic Actions button (when rows selected) */}
      <div className="flex items-center gap-2.5 flex-1">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-7 bg-zinc-950 border-zinc-800 text-xs h-8 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:border-zinc-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Dynamic Action button: right next to search when rows are selected */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 shrink-0" ref={actionMenuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Actions ({selectedCount})</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    actionDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {actionDropdownOpen && (
                <div className="absolute left-0 mt-1 z-50 w-48 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/80 p-1 divide-y divide-zinc-800">
                  <div className="px-2.5 py-1 text-[10px] text-zinc-500 uppercase font-semibold">
                    Set Status To
                  </div>
                  <div className="py-0.5 space-y-0.5">
                    {allStatuses.map((st) => {
                      const cfg = STATUS_CONFIG[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            if (onApplyBulkStatus) onApplyBulkStatus(st);
                            setActionDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-md transition-colors cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-1.5 py-1 rounded hover:bg-zinc-800 cursor-pointer"
                title="Deselect all"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side: Status dropdown + Event dropdown + Count + Reset */}
      <div className="flex items-center gap-2.5 flex-wrap justify-between sm:justify-end shrink-0">
        {/* Status Dropdown (always visible) */}
        <StatusDropdown
          selectedStatus={selectedStatus}
          onSelectStatus={onStatusChange}
          countsByStatus={countsByStatus}
        />

        {/* Event Dropdown */}
        <div className="w-44">
          <EventDropdown
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={onEventChange}
          />
        </div>

        {/* Total count badge */}
        {totalCount !== undefined && (
          <span className="text-[11px] px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono shrink-0">
            {totalCount} leads
          </span>
        )}

        {/* Reset filter */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-zinc-800"
            title="Reset filters"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
