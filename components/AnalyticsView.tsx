"use client";

import React, { useMemo } from "react";
import {
  BarChart2,
  Users,
  CheckCircle,
  Calendar,
  AlertCircle,
  TrendingUp,
  Tag,
} from "lucide-react";
import { Lead } from "@/lib/api";
import { isLeadStale } from "@/components/LeadTable";

interface AnalyticsViewProps {
  leads: Lead[];
  events: string[];
}

export function AnalyticsView({ leads, events }: AnalyticsViewProps) {
  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l) => l.status === "CONTACTED").length;
    const booked = leads.filter((l) => l.status === "BOOKED").length;
    const closed = leads.filter((l) => l.status === "CLOSED").length;
    const pending = leads.filter((l) => l.status === "PENDING").length;
    const notInterested = leads.filter((l) => l.status === "NOT_INTERESTED").length;
    const stale = leads.filter((l) => isLeadStale(l)).length;

    const engaged = contacted + booked + closed;
    const conversionRate = total > 0 ? Math.round((engaged / total) * 100) : 0;
    const bookedRate = total > 0 ? Math.round((booked / total) * 100) : 0;

    const byEvent: Record<string, number> = {};
    leads.forEach((l) => {
      byEvent[l.event] = (byEvent[l.event] || 0) + 1;
    });

    const tagCounts: Record<string, number> = {};
    leads.forEach((l) => {
      (l.ai_tags || []).forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total,
      contacted,
      booked,
      closed,
      pending,
      notInterested,
      stale,
      conversionRate,
      bookedRate,
      byEvent,
      topTags,
    };
  }, [leads]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            Pipeline Metrics
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Conversion rates, status funnel, and event stats.
          </p>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          {stats.total} total leads
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Leads</span>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats.total}</div>
          <p className="text-[11px] text-zinc-500">{events.length} events</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Contacted Rate</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.conversionRate}%</div>
          <p className="text-[11px] text-zinc-500">{stats.contacted + stats.booked + stats.closed} engaged</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Booked Meetings</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.booked}</div>
          <p className="text-[11px] text-zinc-500">{stats.bookedRate}% of pipeline</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Stale Leads</span>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.stale}</div>
          <p className="text-[11px] text-zinc-500">&gt;7 days pending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300">
            Pipeline Distribution
          </h3>

          <div className="space-y-2">
            {[
              { label: "Pending", count: stats.pending, color: "bg-amber-500" },
              { label: "Contacted", count: stats.contacted, color: "bg-blue-500" },
              { label: "Booked", count: stats.booked, color: "bg-emerald-500" },
              { label: "Closed", count: stats.closed, color: "bg-zinc-500" },
              { label: "Not Interested", count: stats.notInterested, color: "bg-red-500" },
            ].map((item) => {
              const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="text-zinc-300 font-mono">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300">
            Events Breakdown
          </h3>

          <div className="space-y-2">
            {Object.entries(stats.byEvent).map(([eventName, count]) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={eventName} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">{eventName}</span>
                    <span className="text-zinc-400 font-mono">{count} leads</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Tags */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
        <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-zinc-400" />
          Tags Extracted by Gemini
        </h3>

        {stats.topTags.length === 0 ? (
          <p className="text-xs text-zinc-500">No tags generated yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stats.topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono"
              >
                #{tag} <span className="text-zinc-500">({count})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
