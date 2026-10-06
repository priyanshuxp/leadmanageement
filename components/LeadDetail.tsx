"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  Building2,
  Mail,
  Calendar,
  Send,
  Edit2,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Lead,
  LeadStatus,
  summarizeLead,
  draftFollowup,
  deleteLead,
  updateLead,
  TranscribeResult,
} from "@/lib/api";
import { isLeadStale } from "@/components/LeadTable";
import { StatusPicker } from "@/components/ui/StatusPicker";
import { VoiceCapture } from "@/components/VoiceCapture";
import { LeadForm } from "@/components/LeadForm";
import { parseEmailDraft, buildGmailComposeUrl, buildMailtoUrl } from "@/lib/email";
import { toast } from "sonner";

interface LeadDetailProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
  onLeadDeleted: (deletedLeadId: string) => void;
  knownEvents?: string[];
}

export function LeadDetail({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
  knownEvents = [],
}: LeadDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [showReRecord, setShowReRecord] = useState(false);
  const [waitingGmailConfirmation, setWaitingGmailConfirmation] = useState(false);

  if (!isOpen || !lead) return null;

  const stale = isLeadStale(lead);

  const handleSummarize = async () => {
    if (!lead.notes || !lead.notes.trim()) {
      toast.error("Please add raw notes before generating summary.");
      return;
    }

    setIsSummarizing(true);
    const toastId = toast.loading("Generating AI summary and tags...");

    try {
      const updated = await summarizeLead(lead.id);
      onLeadUpdated(updated);
      toast.success("Summary and tags updated", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Summarization failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDraftFollowup = async () => {
    setIsDrafting(true);
    const toastId = toast.loading("Drafting follow-up email with AI...");

    try {
      const updated = await draftFollowup(lead.id);
      onLeadUpdated(updated);
      toast.success("Follow-up draft ready", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Drafting failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleReRecordTranscribed = async (result: TranscribeResult) => {
    try {
      const newNotes = lead.notes
        ? `${lead.notes}\n\n[Voice Note]: ${result.transcript}`
        : result.transcript;

      const updated = await updateLead(lead.id, {
        notes: newNotes,
        ai_summary: result.summary || lead.ai_summary,
        ai_tags: Array.from(new Set([...(lead.ai_tags || []), ...(result.tags || [])])),
      });

      onLeadUpdated(updated);
      setShowReRecord(false);
      toast.success("Lead updated with audio transcription");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save audio notes";
      toast.error(msg);
    }
  };

  const handleQuickStatusChange = async (newStatus: LeadStatus) => {
    try {
      const updated = await updateLead(lead.id, { status: newStatus });
      onLeadUpdated(updated);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete lead "${lead.name}"?`)) return;

    setIsDeleting(true);
    try {
      await deleteLead(lead.id);
      toast.success("Lead deleted");
      onLeadDeleted(lead.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col text-zinc-100">
          {/* Header */}
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">
                Lead Detail
              </span>
              {stale && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                  Stale
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-8 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                {isEditing ? "View" : "Edit"}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isEditing ? (
              <LeadForm
                initialData={lead}
                onSubmit={async (data) => {
                  try {
                    const updated = await updateLead(lead.id, data);
                    onLeadUpdated(updated);
                    setIsEditing(false);
                    toast.success("Lead updated");
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Update failed";
                    toast.error(msg);
                  }
                }}
                onCancel={() => setIsEditing(false)}
                knownEvents={knownEvents}
              />
            ) : (
              <>
                {/* Contact Card (Building2 icon - NO STAR ICON) */}
                <div className="space-y-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-100">{lead.name}</h2>
                      {lead.company && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{lead.company}</span>
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs text-indigo-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-indigo-500" />
                          <a href={`mailto:${lead.email}`} className="hover:underline">
                            {lead.email}
                          </a>
                        </p>
                      )}
                    </div>

                    <div>
                      <StatusPicker
                        status={lead.status}
                        onChange={handleQuickStatusChange}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                      <Calendar className="h-3 w-3 text-zinc-400" />
                      {lead.event}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                    {lead.last_contacted && (
                      <span className="text-blue-400">
                        • Last contacted {formatDistanceToNow(new Date(lead.last_contacted), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Actions Row */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-zinc-400 block">
                    AI Actions
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="bg-zinc-850 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-8"
                    >
                      {isSummarizing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                      )}
                      Summarize
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDraftFollowup}
                      disabled={isDrafting}
                      className="bg-zinc-850 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-8"
                    >
                      {isDrafting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Send className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                      )}
                      Draft Email
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReRecord(!showReRecord)}
                      className="bg-zinc-850 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-8"
                    >
                      <Mic className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                      Re-record
                    </Button>
                  </div>

                  {showReRecord && (
                    <div className="pt-2">
                      <VoiceCapture
                        onTranscribed={handleReRecordTranscribed}
                        compact={false}
                      />
                    </div>
                  )}
                </div>

                {/* AI Summary & Tags */}
                {lead.ai_summary && (
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-xs font-semibold text-zinc-300 block">
                      AI Summary
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {lead.ai_summary}
                    </p>

                    {lead.ai_tags && lead.ai_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {lead.ai_tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up Email Draft */}
                {lead.follow_up_draft && (() => {
                  const parsed = parseEmailDraft(lead.follow_up_draft);
                  const gmailUrl = buildGmailComposeUrl(lead.email || "", parsed.subject, parsed.body);
                  const mailtoUrl = buildMailtoUrl(lead.email || "", parsed.subject, parsed.body);

                  const handleOpenInGmail = () => {
                    window.open(gmailUrl, "_blank", "noopener,noreferrer");
                    setWaitingGmailConfirmation(true);
                    toast.info("Gmail opened in a new tab. Confirm below once you hit send.");
                  };

                  const handleConfirmSent = async () => {
                    try {
                      const updated = await updateLead(lead.id, { status: "CONTACTED" });
                      onLeadUpdated(updated);
                      setWaitingGmailConfirmation(false);
                      toast.success("Lead marked as Contacted");
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : "Update failed";
                      toast.error(msg);
                    }
                  };

                  const handleKeepPending = () => {
                    setWaitingGmailConfirmation(false);
                    toast("Kept as pending draft.");
                  };

                  return (
                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300">
                          Follow-up Draft
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(lead.follow_up_draft || "")}
                          className="h-6 text-xs text-zinc-400 hover:text-zinc-100"
                        >
                          {copiedDraft ? (
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
                      </div>

                      <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-200 space-y-1.5">
                        {parsed.subject && (
                          <div className="pb-1 border-b border-zinc-800 font-medium text-zinc-100">
                            {parsed.subject}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed text-zinc-300">
                          {parsed.body}
                        </div>
                      </div>

                      {waitingGmailConfirmation && (
                        <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg space-y-2 text-xs">
                          <span className="font-semibold text-zinc-200 block">
                            Did you send the email in Gmail?
                          </span>
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
                              onClick={handleKeepPending}
                              className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-zinc-200"
                            >
                              Keep Pending
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                          To: {lead.email || "No email"}
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={mailtoUrl}
                            className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded border border-zinc-800 bg-zinc-900"
                          >
                            Default Mail
                          </a>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleOpenInGmail}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-7 px-2.5"
                          >
                            Open in Gmail &rarr;
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Raw Notes (Source of Truth) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-zinc-500" />
                      Raw Notes (Source of Truth)
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[80px]">
                    {lead.notes || <span className="text-zinc-600 italic">No notes</span>}
                  </div>
                </div>

                {/* Delete */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">
                    {lead.id.slice(0, 8)}
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Lead
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
