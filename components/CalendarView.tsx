"use client";

import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/lib/api";
import { getStatusBadgeConfig } from "@/components/LeadTable";

interface CalendarViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function CalendarView({ leads, onSelectLead }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<"all" | "booked" | "pending">("all");

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const filteredLeads = leads.filter((lead) => {
    if (filterType === "booked") return lead.status === "BOOKED";
    if (filterType === "pending") return lead.status === "PENDING";
    return true;
  });

  const getLeadDate = (lead: Lead): Date => {
    if (lead.event_date) {
      try {
        return parseISO(lead.event_date);
      } catch {
        // fallback
      }
    }
    return parseISO(lead.created_at);
  };

  const getLeadsForDay = (day: Date) => {
    return filteredLeads.filter((lead) => isSameDay(getLeadDate(lead), day));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedDayLeads = getLeadsForDay(selectedDate);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-indigo-400" />
            Calendar & Schedule
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Event dates, booked meetings, and follow-up timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === "all" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("booked")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === "booked" ? "bg-emerald-900/60 text-emerald-300 font-medium" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Booked
            </button>
            <button
              type="button"
              onClick={() => setFilterType("pending")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === "pending" ? "bg-amber-900/60 text-amber-300 font-medium" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pending
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs h-8 border-zinc-700 bg-zinc-850 text-zinc-300 hover:text-white"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={prevMonth}
                className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={nextMonth}
                className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-zinc-500 py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dateItem, idx) => {
              const dayLeads = getLeadsForDay(dateItem);
              const isSelected = isSameDay(dateItem, selectedDate);
              const isCurrentMonthDay = isSameMonth(dateItem, currentMonth);
              const isToday = isSameDay(dateItem, new Date());

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(dateItem)}
                  className={`min-h-[75px] p-1.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-500 bg-zinc-800/80"
                      : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60"
                  } ${!isCurrentMonthDay ? "opacity-30" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? "bg-indigo-600 text-white font-bold"
                          : isSelected
                          ? "text-indigo-400 font-semibold"
                          : "text-zinc-400"
                      }`}
                    >
                      {format(dateItem, "d")}
                    </span>

                    {dayLeads.length > 0 && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {dayLeads.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 mt-1 overflow-hidden">
                    {dayLeads.slice(0, 2).map((l) => {
                      const cfg = getStatusBadgeConfig(l.status);
                      return (
                        <div
                          key={l.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(l);
                          }}
                          className={`text-[10px] px-1 py-0.2 rounded truncate border ${cfg.classes}`}
                        >
                          {l.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Selected Date Details */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <span className="text-[10px] uppercase font-medium text-zinc-500">
                Selected Date
              </span>
              <h4 className="text-sm font-semibold text-zinc-100 mt-0.5">
                {format(selectedDate, "MMM d, yyyy")}
              </h4>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {selectedDayLeads.length} contacts
            </span>
          </div>

          {selectedDayLeads.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No contacts on this date.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayLeads.map((lead) => {
                const cfg = getStatusBadgeConfig(lead.status);

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer space-y-1.5 bg-zinc-950/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-semibold text-zinc-100">
                          {lead.name}
                        </h5>
                        {lead.company && (
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-zinc-500" />
                            {lead.company}
                          </p>
                        )}
                      </div>

                      <span className={`text-[10px] px-1.5 py-0.2 rounded border ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/80">
                      <span className="truncate">{lead.event}</span>
                      <span className="text-indigo-400">View &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
