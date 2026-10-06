"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { STATUS_OPTIONS } from "@/components/Filters";

interface StatusDropdownProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  countsByStatus?: Record<string, number>;
}

export function StatusDropdown({
  selectedStatus,
  onSelectStatus,
  countsByStatus = {},
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus) || STATUS_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
        onClick={() => setOpen(!open)}
        className="h-8 px-2.5 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <span>Status:</span>
        <span className="font-semibold text-zinc-100">{activeOption.label}</span>
        {countsByStatus[activeOption.value] !== undefined && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
            {countsByStatus[activeOption.value]}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1 z-50 w-52 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/80 p-1 divide-y divide-zinc-850">
          <div className="py-0.5 space-y-0.5">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              const count = countsByStatus[opt.value];

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelectStatus(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-100 font-medium"
                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{opt.label}</span>
                    {count !== undefined && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({count})
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
