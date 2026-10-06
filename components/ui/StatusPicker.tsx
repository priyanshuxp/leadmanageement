"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LeadStatus } from "@/lib/api";

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: "Pending",
    badgeClass: "bg-amber-950/60 text-amber-300 border-amber-800/80",
    dotClass: "bg-amber-400",
  },
  CONTACTED: {
    label: "Contacted",
    badgeClass: "bg-blue-950/60 text-blue-300 border-blue-800/80",
    dotClass: "bg-blue-400",
  },
  BOOKED: {
    label: "Booked",
    badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-800/80",
    dotClass: "bg-emerald-400",
  },
  CLOSED: {
    label: "Closed",
    badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
    dotClass: "bg-zinc-400",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    badgeClass: "bg-rose-950/60 text-rose-300 border-rose-800/80",
    dotClass: "bg-rose-400",
  },
};

interface StatusPickerProps {
  status: LeadStatus;
  onChange: (status: LeadStatus) => void;
  size?: "sm" | "default";
}

export function StatusPicker({ status, onChange, size = "sm" }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors cursor-pointer ${
          current.badgeClass
        } hover:brightness-110 active:scale-95 ${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`} />
        <span>{current.label}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 z-50 w-44 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/80 p-1 divide-y divide-zinc-850"
        >
          <div className="py-0.5 space-y-0.5">
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((key) => {
              const item = STATUS_CONFIG[key];
              const isSelected = key === status;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-100 font-medium"
                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.dotClass}`} />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
