"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Check,
} from "lucide-react";
import { Lead, LeadStatus } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusPicker, STATUS_CONFIG } from "@/components/ui/StatusPicker";

interface LeadTableProps {
  leads: Lead[];
  totalLeads: number;
  isLoading: boolean;
  onSelectLead: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  selectedLeadId?: string | null;
  // Selection passed from parent for single-line toolbar integration
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  // Server-side pagination & sorting
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSortChange: (field: string) => void;
}

export function isLeadStale(lead: Lead): boolean {
  if (lead.status !== "PENDING") return false;
  const createdAt = new Date(lead.created_at).getTime();
  const now = new Date().getTime();
  const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

export function getStatusBadgeConfig(status: LeadStatus) {
  const item = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return {
    label: item.label,
    classes: item.badgeClass,
  };
}

export function LeadTable({
  leads,
  totalLeads,
  isLoading,
  onSelectLead,
  onStatusChange,
  selectedLeadId,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  sortField,
  sortDirection,
  onSortChange,
}: LeadTableProps) {
  const allCurrentPageSelected =
    leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-indigo-400 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-400 ml-1 inline" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center px-4">
          <Skeleton className="h-3 w-48 bg-zinc-800" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40 bg-zinc-800" />
              <Skeleton className="h-3 w-60 bg-zinc-800/60" />
            </div>
            <Skeleton className="h-6 w-20 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-zinc-900/80 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
        <User className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-zinc-200">No leads found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
          No records match your active search or filters.
        </p>
      </div>
    );
  }

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalLeads);

  return (
    <div className="space-y-3">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-zinc-900/90 border border-zinc-800/80 rounded-xl overflow-visible shadow-lg">
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-10" />
            <col className="w-64" />
            <col className="w-44" />
            <col />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-10" />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider select-none">
              <th className="py-3 px-3.5">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    allCurrentPageSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                      : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
                  }`}
                  title="Select all"
                >
                  {allCurrentPageSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </button>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-zinc-200 transition-colors"
                onClick={() => onSortChange("name")}
              >
                <div className="flex items-center gap-1">
                  <span>Contact</span>
                  {renderSortIndicator("name")}
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-zinc-200 transition-colors"
                onClick={() => onSortChange("event")}
              >
                <div className="flex items-center gap-1">
                  <span>Event</span>
                  {renderSortIndicator("event")}
                </div>
              </th>
              <th className="py-3 px-3">
                <span>Summary / Notes</span>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-zinc-200 transition-colors"
                onClick={() => onSortChange("status")}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {renderSortIndicator("status")}
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-zinc-200 transition-colors"
                onClick={() => onSortChange("created_at")}
              >
                <div className="flex items-center gap-1">
                  <span>Captured</span>
                  {renderSortIndicator("created_at")}
                </div>
              </th>
              <th className="py-3 px-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-xs">
            {leads.map((lead) => {
              const stale = isLeadStale(lead);
              const isSelected = selectedLeadId === lead.id;
              const isChecked = selectedIds.has(lead.id);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`group hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                    isSelected ? "bg-zinc-800/90 ring-1 ring-inset ring-indigo-500/30" : ""
                  } ${isChecked ? "bg-indigo-950/25" : ""}`}
                >
                  {/* Custom Checkbox */}
                  <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectOne(lead.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3 px-3 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-zinc-100 group-hover:text-indigo-200 transition-colors truncate max-w-[170px]">
                        {lead.name}
                      </span>
                      {stale && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/80">
                          Stale
                        </span>
                      )}
                    </div>
                    {lead.company && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {lead.company}
                      </p>
                    )}
                    {lead.email && (
                      <p className="text-[11px] text-zinc-500 mt-0.2 truncate">
                        {lead.email}
                      </p>
                    )}
                  </td>

                  {/* Event */}
                  <td className="py-3 px-3 text-zinc-300">
                    <span className="inline-block px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/60 text-[11px] text-zinc-300 truncate max-w-[150px]">
                      {lead.event}
                    </span>
                  </td>

                  {/* Notes / Summary */}
                  <td className="py-3 px-3 pr-4">
                    {lead.ai_summary ? (
                      <div>
                        <p className="text-zinc-300 line-clamp-1 leading-relaxed">
                          {lead.ai_summary}
                        </p>
                        {lead.ai_tags && lead.ai_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.ai_tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/80 font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                            {lead.ai_tags.length > 3 && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                +{lead.ai_tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-500 line-clamp-1 italic">
                        {lead.notes || "No notes"}
                      </p>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    <StatusPicker
                      status={lead.status}
                      onChange={(newStatus) => onStatusChange(lead.id, newStatus)}
                      size="sm"
                    />
                  </td>

                  {/* Created At */}
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap text-[11px]">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-2 text-right">
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Server-Side Pagination Footer */}
        <div className="px-4 py-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-zinc-200">{startRecord}</strong> to{" "}
              <strong className="text-zinc-200">{endRecord}</strong> of{" "}
              <strong className="text-zinc-200">{totalLeads}</strong> leads
            </span>

            {/* Rows Per Page */}
            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-3">
              <span className="text-zinc-500">Rows:</span>
              <div className="inline-flex rounded-md bg-zinc-900 border border-zinc-800 p-0.5">
                {[5, 10, 20, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onPageSizeChange(size);
                    }}
                    className={`px-1.5 py-0.5 text-[11px] rounded transition-colors ${
                      pageSize === size
                        ? "bg-zinc-800 text-zinc-100 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-1">
            <span className="mr-2">
              Page <strong className="text-zinc-200">{currentPage}</strong> of{" "}
              <strong className="text-zinc-200">{totalPages}</strong>
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Card Grid View */}
      <div className="md:hidden space-y-2">
        {leads.map((lead) => {
          const stale = isLeadStale(lead);

          return (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2.5 cursor-pointer hover:border-zinc-700 transition-colors relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-zinc-100 text-sm">{lead.name}</h4>
                    {stale && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/80">
                        Stale
                      </span>
                    )}
                  </div>
                  {lead.company && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {lead.company}
                    </p>
                  )}
                  {lead.email && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {lead.email}
                    </p>
                  )}
                </div>

                <div className="relative z-30 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <StatusPicker
                    status={lead.status}
                    onChange={(newStatus) => onStatusChange(lead.id, newStatus)}
                    size="sm"
                  />
                </div>
              </div>

              {lead.ai_summary ? (
                <p className="text-xs text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 line-clamp-2">
                  {lead.ai_summary}
                </p>
              ) : lead.notes ? (
                <p className="text-xs text-zinc-500 line-clamp-2 italic bg-zinc-950 p-2 rounded border border-zinc-800">
                  {lead.notes}
                </p>
              ) : null}

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-800">
                <span className="px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/60 text-zinc-300 font-medium">
                  {lead.event}
                </span>
                <span>
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Mobile Pagination Bar */}
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between text-xs text-zinc-400">
          <span>
            {startRecord}-{endRecord} of {totalLeads}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="h-7 px-2 border-zinc-800 bg-zinc-950 text-zinc-300 text-xs"
            >
              Prev
            </Button>
            <span className="px-1 text-zinc-300 font-mono">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="h-7 px-2 border-zinc-800 bg-zinc-950 text-zinc-300 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
