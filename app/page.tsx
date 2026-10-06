"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Lead,
  LeadStatus,
  LeadCreateInput,
  getLeads,
  getEvents,
  createLead,
  updateLead,
} from "@/lib/api";
import { AppSidebar, ActiveTab } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Filters } from "@/components/Filters";
import { LeadTable } from "@/components/LeadTable";
import { LeadDetail } from "@/components/LeadDetail";
import { LeadForm } from "@/components/LeadForm";
import { CalendarView } from "@/components/CalendarView";
import { MailerView } from "@/components/MailerView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { toast } from "sonner";

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("leads");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Leads & server pagination state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [countsByStatus, setCountsByStatus] = useState<Record<string, number>>({});

  // Row selection state (controlled here so Actions appear in the top filter toolbar)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting state (server-side)
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filters state
  const [events, setEvents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals / slide-overs
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Load events list once on mount
  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to fetch events:", err));
  }, []);

  // Fetch leads with server-side pagination, sorting, search, filtering
  const loadData = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const resp = await getLeads({
          q: searchQuery,
          event: selectedEvent,
          status: selectedStatus,
          page: currentPage,
          page_size: pageSize,
          sort_by: sortField,
          sort_order: sortDirection,
        });

        setLeads(resp.items);
        setTotalLeads(resp.total);
        setTotalPages(resp.total_pages);
        setCountsByStatus(resp.counts_by_status || {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load leads";
        toast.error(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, selectedEvent, selectedStatus, currentPage, pageSize, sortField, sortDirection]
  );

  // Reset to page 1 & clear selections whenever search, event, or status changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, selectedEvent, selectedStatus]);

  // Trigger data fetch on relevant dependencies
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Handle header sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const pendingLeadsCount = countsByStatus["PENDING"] ?? 0;

  // Selection handlers
  const handleToggleSelectAll = () => {
    const allCurrentPageSelected =
      leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      leads.forEach((l) => next.delete(l.id));
    } else {
      leads.forEach((l) => next.add(l.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Optimistic single status update
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const previousLeads = [...leads];
    const previousSelected = selectedLead;

    // Apply optimistic update immediately
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: newStatus,
              last_contacted:
                newStatus === "CONTACTED"
                  ? new Date().toISOString()
                  : l.last_contacted,
            }
          : l
      )
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        status: newStatus,
        last_contacted:
          newStatus === "CONTACTED"
            ? new Date().toISOString()
            : selectedLead.last_contacted,
      });
    }

    try {
      const updated = await updateLead(leadId, { status: newStatus });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(updated);
      }
      toast.success(`Status updated to ${newStatus}`);
      loadData(false);
    } catch (err: unknown) {
      setLeads(previousLeads);
      setSelectedLead(previousSelected);
      const msg = err instanceof Error ? err.message : "Status update failed";
      toast.error(`Reverted: ${msg}`);
    }
  };

  // Bulk status update from unified toolbar Actions button
  const handleBulkStatusChange = async (newStatus: LeadStatus) => {
    const leadIds = Array.from(selectedIds);
    if (leadIds.length === 0) return;

    toast.info(`Updating ${leadIds.length} leads...`);
    try {
      await Promise.all(leadIds.map((id) => updateLead(id, { status: newStatus })));
      setSelectedIds(new Set());
      loadData(false);
      toast.success(`Updated ${leadIds.length} leads to ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk update failed";
      toast.error(msg);
    }
  };

  // Create lead handler
  const handleCreateLead = async (data: LeadCreateInput) => {
    setIsSubmittingCreate(true);
    try {
      const newLead = await createLead(data);
      if (!events.includes(newLead.event)) {
        setEvents((prev) => [...prev, newLead.event]);
      }
      setIsCreateModalOpen(false);
      setSelectedLead(newLead);
      toast.success("Lead created");
      loadData(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create lead";
      toast.error(msg);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Update lead from detail view or mailer view
  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
    loadData(false);
  };

  // Delete lead handler
  const handleLeadDeleted = (deletedLeadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== deletedLeadId));
    if (selectedLead?.id === deletedLeadId) {
      setSelectedLead(null);
    }
    loadData(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Desktop Left Sidebar (hidden on mobile) */}
      <div className="hidden md:flex">
        <AppSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          leadsCount={totalLeads}
          pendingCount={pendingLeadsCount}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-18 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100 capitalize">
                {activeTab === "leads" && "Leads"}
                {activeTab === "calendar" && "Calendar"}
                {activeTab === "mailer" && "Email Outreach"}
                {activeTab === "analytics" && "Analytics"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(false)}
                disabled={isRefreshing}
                className="h-8 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </Button>

              <Button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 rounded-lg"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Lead</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Tab View Switcher */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* TAB 1: LEADS */}
          {activeTab === "leads" && (
            <div className="space-y-4">
              {/* Unified Single-Line Toolbar: Search & Dynamic Actions (Left) + Status, Event & Counts (Right) */}
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 sm:p-3.5 rounded-xl backdrop-blur-sm">
                <Filters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedEvent={selectedEvent}
                  onEventChange={setSelectedEvent}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  events={events}
                  countsByStatus={countsByStatus}
                  totalCount={totalLeads}
                  selectedCount={selectedIds.size}
                  onApplyBulkStatus={handleBulkStatusChange}
                  onClearSelection={() => setSelectedIds(new Set())}
                />
              </div>

              {/* Full Width Table Section */}
              <section className="w-full space-y-3">
                <LeadTable
                  leads={leads}
                  totalLeads={totalLeads}
                  isLoading={isLoading}
                  onSelectLead={(lead) => setSelectedLead(lead)}
                  onStatusChange={handleStatusChange}
                  selectedLeadId={selectedLead?.id}
                  selectedIds={selectedIds}
                  onToggleSelectAll={handleToggleSelectAll}
                  onToggleSelectOne={handleToggleSelectOne}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                />
              </section>
            </div>
          )}

          {/* TAB 2: CALENDAR */}
          {activeTab === "calendar" && (
            <CalendarView
              leads={leads}
              onSelectLead={(lead) => setSelectedLead(lead)}
            />
          )}

          {/* TAB 3: EMAIL OUTREACH */}
          {activeTab === "mailer" && (
            <MailerView
              leads={leads}
              onLeadUpdated={handleLeadUpdated}
              onSelectLeadForDetail={(lead) => setSelectedLead(lead)}
            />
          )}

          {/* TAB 4: ANALYTICS */}
          {activeTab === "analytics" && (
            <AnalyticsView leads={leads} events={events} />
          )}
        </main>
      </div>

      {/* Native Mobile Bottom Navigation Bar (hidden on desktop) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        leadsCount={totalLeads}
        pendingCount={pendingLeadsCount}
      />

      {/* Slide-Over Detail View */}
      <LeadDetail
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
        knownEvents={events}
      />

      {/* Create Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <LeadForm
              onSubmit={handleCreateLead}
              onCancel={() => setIsCreateModalOpen(false)}
              isLoading={isSubmittingCreate}
              knownEvents={events}
            />
          </div>
        </div>
      )}
    </div>
  );
}
