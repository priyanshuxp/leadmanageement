"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Building2,
  Mail,
  Calendar,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lead, LeadCreateInput, LeadUpdateInput, LeadStatus, TranscribeResult } from "@/lib/api";
import { StatusPicker } from "@/components/ui/StatusPicker";
import { VoiceCapture } from "@/components/VoiceCapture";
import { toast } from "sonner";

interface LeadFormProps {
  initialData?: Lead | null;
  onSubmit: (data: LeadCreateInput | LeadUpdateInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  knownEvents?: string[];
}

export function LeadForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  knownEvents = [],
}: LeadFormProps) {
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState(initialData?.name || "");
  const [company, setCompany] = useState(initialData?.company || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [event, setEvent] = useState(initialData?.event || "");
  const [status, setStatus] = useState<LeadStatus>(initialData?.status || "PENDING");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [aiSummary, setAiSummary] = useState(initialData?.ai_summary || "");
  const [tags, setTags] = useState<string[]>(initialData?.ai_tags || []);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCompany(initialData.company || "");
      setEmail(initialData.email || "");
      setEvent(initialData.event || "");
      setStatus(initialData.status || "PENDING");
      setNotes(initialData.notes || "");
      setAiSummary(initialData.ai_summary || "");
      setTags(initialData.ai_tags || []);
    }
  }, [initialData]);

  const handleVoiceTranscribed = (result: TranscribeResult) => {
    if (result.name && !name) setName(result.name);
    if (result.company && !company) setCompany(result.company);
    if (result.email && !email) setEmail(result.email);
    if (result.event && !event) setEvent(result.event);
    if (result.transcript) {
      setNotes((prev) => (prev ? `${prev}\n\n[Voice Note]: ${result.transcript}` : result.transcript));
    }
    if (result.summary) {
      setAiSummary(result.summary);
    }
    if (result.tags && result.tags.length > 0) {
      setTags((prev) => Array.from(new Set([...prev, ...result.tags])));
    }
    toast.success("Form pre-filled from audio");
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Contact name is required");
      return;
    }
    if (!event.trim()) {
      toast.error("Event name is required");
      return;
    }

    const payload: LeadCreateInput = {
      name: name.trim(),
      company: company.trim() || null,
      email: email.trim() || null,
      event: event.trim(),
      notes: notes.trim() || null,
      ai_summary: aiSummary.trim() || null,
      ai_tags: tags,
      status,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Voice Capture Option */}
      {!isEditing && (
        <div className="mb-2">
          <VoiceCapture onTranscribed={handleVoiceTranscribed} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Contact Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="pl-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9"
              required
            />
          </div>
        </div>

        {/* Company (Building2 icon - NO STAR ICON) */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Company
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="pl-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              className="pl-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9"
            />
          </div>
        </div>

        {/* Event */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Event Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. SaaS Summit 2026"
              className="pl-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9"
              required
              list="known-events-list"
            />
            {knownEvents.length > 0 && (
              <datalist id="known-events-list">
                {knownEvents.map((evt) => (
                  <option key={evt} value={evt} />
                ))}
              </datalist>
            )}
          </div>
        </div>
      </div>

      {/* Status Picker */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1">
          Status
        </label>
        <div>
          <StatusPicker status={status} onChange={setStatus} size="default" />
        </div>
      </div>

      {/* Raw Notes */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-zinc-300">
            Raw Notes
          </label>
          <span className="text-[11px] text-zinc-500">
            Never overwritten by AI
          </span>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter conversation notes, talking points, context..."
          rows={3}
          className="text-xs bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
        />
      </div>

      {/* AI Derived Summary & Tags (Optional) */}
      {(aiSummary || tags.length > 0) && (
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">
            AI Generated Insights
          </span>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Summary</label>
            <Input
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="1-2 sentence summary..."
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-200 h-8"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Tags</label>
            <div className="flex flex-wrap items-center gap-1 mb-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                className="h-7 text-xs max-w-xs bg-zinc-900 border-zinc-800 text-zinc-200"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="h-7 text-xs border-zinc-700 text-zinc-300 hover:text-white"
              >
                <Plus className="h-3 w-3 mr-0.5" /> Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white min-w-[90px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              Saving...
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Lead"
          )}
        </Button>
      </div>
    </form>
  );
}
