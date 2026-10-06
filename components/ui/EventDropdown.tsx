"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";

interface EventDropdownProps {
  events: string[];
  selectedEvent: string;
  onSelectEvent: (event: string) => void;
}

export function EventDropdown({
  events,
  selectedEvent,
  onSelectEvent,
}: EventDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayLabel =
    selectedEvent === "all"
      ? `All Events (${events.length})`
      : selectedEvent;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl p-1 max-h-56 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onSelectEvent("all");
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
              selectedEvent === "all"
                ? "bg-zinc-800 text-zinc-100 font-medium"
                : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
            }`}
          >
            <span>All Events ({events.length})</span>
            {selectedEvent === "all" && <Check className="h-3.5 w-3.5 text-indigo-400" />}
          </button>

          {events.map((evt) => {
            const isSelected = selectedEvent === evt;
            return (
              <button
                key={evt}
                type="button"
                onClick={() => {
                  onSelectEvent(evt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer mt-0.5 ${
                  isSelected
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                }`}
              >
                <span className="truncate">{evt}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
