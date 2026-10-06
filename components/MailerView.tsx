"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Building2,
  Calendar,
  Loader2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lead, draftFollowup, updateLead } from "@/lib/api";
import { getStatusBadgeConfig, isLeadStale } from "@/components/LeadTable";
import { parseEmailDraft, buildGmailComposeUrl, buildMailtoUrl } from "@/lib/email";
import { toast } from "sonner";

interface MailerViewProps {
  leads: Lead[];
  onLeadUpdated: (lead: Lead) => void;
  onSelectLeadForDetail: (lead: Lead) => void;
}

export function MailerView({
  leads,
  onLeadUpdated,
  onSelectLeadForDetail,
}: MailerViewProps) {
  const [filterMode, setFilterMode] = useState<"pending" | "contacted" | "all">("pending");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Email form fields
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    if (filterMode === "pending") return lead.status === "PENDING";
    if (filterMode === "contacted") return lead.status === "CONTACTED";
    return true;
  });

  const activeLead = leads.find((l) => l.id === selectedLeadId) || filteredLeads[0] || null;

  useEffect(() => {
    if (activeLead) {
      setSelectedLeadId(activeLead.id);
      setToEmail(activeLead.email || "");

      if (activeLead.follow_up_draft) {
        const parsed = parseEmailDraft(activeLead.follow_up_draft);
        setSubject(parsed.subject);
        setBody(parsed.body);
      } else {
        setSubject(`Great meeting you at ${activeLead.event}`);
        setBody(
          `Hi ${activeLead.name},\n\nIt was great connecting with you at ${activeLead.event}. I enjoyed discussing ${
            activeLead.company || "your work"
          }.\n\nWould you be open to a brief follow-up chat next week?`
        );
      }
    }
  }, [activeLead?.id]);

  const handleGenerateAI = async () => {
    if (!activeLead) return;

    setIsGenerating(true);
    const toastId = toast.loading("Generating follow-up email with AI...");

    try {
      const updated = await draftFollowup(activeLead.id);
      onLeadUpdated(updated);

      if (updated.follow_up_draft) {
        const parsed = parseEmailDraft(updated.follow_up_draft);
        setSubject(parsed.subject);
        setBody(parsed.body);
      }

      toast.success("Follow-up email generated", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate email";
      toast.error(msg, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const [waitingConfirmationFor, setWaitingConfirmationFor] = useState<string | null>(null);

  const handleOpenInGmail = async () => {
    if (!activeLead) return;
    if (!toEmail.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }

    const gmailUrl = buildGmailComposeUrl(toEmail.trim(), subject.trim(), body.trim());

    // Open Gmail compose tab in new window
    window.open(gmailUrl, "_blank", "noopener,noreferrer");

    // Copy to clipboard as backup
    try {
      navigator.clipboard.writeText(body);
    } catch {
      // ignore
    }

    // Auto-save draft changes to DB so nothing is lost
    try {
      const updated = await updateLead(activeLead.id, {
        email: toEmail.trim(),
        follow_up_draft: `Subject: ${subject.trim()}\n\n${body.trim()}`,
      });
      onLeadUpdated(updated);
    } catch {
      // ignore
    }

    setWaitingConfirmationFor(activeLead.id);
    toast.info("Gmail opened in a new tab. Confirm below once you hit send.");
  };

  const handleConfirmSent = async () => {
    if (!activeLead) return;
    try {
      const updated = await updateLead(activeLead.id, { status: "CONTACTED" });
      onLeadUpdated(updated);
      setWaitingConfirmationFor(null);
      toast.success("Lead marked as Contacted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(msg);
    }
  };

  const handleKeepAsDraft = () => {
    setWaitingConfirmationFor(null);
    toast("Saved as draft. Lead remains Pending.", {
      description: "You can send or edit this email anytime.",
    });
  };

  const handleCopyDraft = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-400" />
            Email Outreach
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Draft follow-ups with AI and send directly via Gmail.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("pending")}
            className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
              filterMode === "pending"
                ? "bg-amber-500 text-zinc-950 font-semibold border-amber-400"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Needs Follow-up ({leads.filter((l) => l.status === "PENDING").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("contacted")}
            className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
              filterMode === "contacted"
                ? "bg-blue-600 text-white font-semibold border-blue-500"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Contacted ({leads.filter((l) => l.status === "CONTACTED").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-zinc-800 text-zinc-100 font-semibold border-zinc-700"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({leads.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Queue List (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 p-3 rounded-xl space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 px-1 text-xs">
            <span className="font-medium text-zinc-400">Queue ({filteredLeads.length})</span>
            <span className="text-[11px] text-zinc-500">Select contact</span>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No contacts in this list.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredLeads.map((lead) => {
                const isSelected = activeLead?.id === lead.id;
                const stale = isLeadStale(lead);
                const cfg = getStatusBadgeConfig(lead.status);

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? "border-zinc-700 bg-zinc-800/80"
                        : "border-zinc-800 hover:border-zinc-750 bg-zinc-950/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-100 truncate">
                            {lead.name}
                          </span>
                          {stale && (
                            <span className="text-[10px] px-1 rounded bg-red-950 text-red-300 border border-red-800">
                              Stale
                            </span>
                          )}
                        </div>

                        {/* Company (Building2 icon - NO STAR ICON) */}
                        {lead.company && (
                          <p className="text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="h-3 w-3 text-zinc-500 shrink-0" />
                            {lead.company}
                          </p>
                        )}
                        <p className="text-zinc-500 truncate mt-0.5">
                          {lead.email || "No email"}
                        </p>
                      </div>

                      <span className={`text-[10px] px-1.5 py-0.2 rounded border shrink-0 ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Composer Studio (7 cols) */}
        <div className="lg:col-span-7">
          {activeLead ? (
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {activeLead.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onSelectLeadForDetail(activeLead)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    {activeLead.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {activeLead.company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {activeLead.event}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="h-8 text-xs border-zinc-700 bg-zinc-850 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-zinc-400" />
                  )}
                  <span>Generate with AI</span>
                </Button>
              </div>

              {/* Context Summary Preview */}
              {(activeLead.ai_summary || activeLead.notes) && (
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 space-y-1">
                  <span className="font-medium text-zinc-300 block">Context:</span>
                  <p className="line-clamp-2">
                    {activeLead.ai_summary || activeLead.notes}
                  </p>
                </div>
              )}

              {/* Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    To
                  </label>
                  <Input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="text-xs bg-zinc-950 border-zinc-800 text-zinc-100 h-8"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Subject
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                    className="text-xs bg-zinc-950 border-zinc-800 text-zinc-100 h-8"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Body
                  </label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    placeholder="Email body..."
                    className="text-xs bg-zinc-950 border-zinc-800 text-zinc-200 leading-relaxed"
                  />
                </div>
              </div>

              {/* Confirmation Banner if Gmail was just opened */}
              {waitingConfirmationFor === activeLead.id && (
                <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">
                      Did you send the email in Gmail?
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Update lead status
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirmSent}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Yes, Mark as Contacted
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleKeepAsDraft}
                      className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-zinc-200"
                    >
                      Keep as Pending (Saved as Draft)
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDraft}
                    className="h-8 text-xs border-zinc-700 bg-zinc-850 text-zinc-300 hover:text-white"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>

                  <a
                    href={buildMailtoUrl(toEmail, subject, body)}
                    className="text-xs px-2.5 py-1.5 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-950 inline-block"
                  >
                    Default Mail App
                  </a>
                </div>

                <Button
                  type="button"
                  onClick={handleOpenInGmail}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-8 px-4 flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Open in Gmail &rarr;</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-xl text-center text-zinc-500 text-xs">
              Select a contact to compose follow-up email.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
