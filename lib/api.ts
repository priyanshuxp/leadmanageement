export type LeadStatus =
  | "PENDING"
  | "CONTACTED"
  | "BOOKED"
  | "CLOSED"
  | "NOT_INTERESTED";

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  event: string;
  event_date: string | null;
  notes: string | null;
  ai_summary: string | null;
  ai_tags: string[];
  follow_up_draft: string | null;
  status: LeadStatus;
  last_contacted: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCreateInput {
  name: string;
  company?: string | null;
  email?: string | null;
  event: string;
  event_date?: string | null;
  notes?: string | null;
  ai_summary?: string | null;
  ai_tags?: string[];
  follow_up_draft?: string | null;
  status?: LeadStatus;
}

export interface LeadUpdateInput {
  name?: string;
  company?: string | null;
  email?: string | null;
  event?: string;
  event_date?: string | null;
  notes?: string | null;
  ai_summary?: string | null;
  ai_tags?: string[];
  follow_up_draft?: string | null;
  status?: LeadStatus;
  last_contacted?: string | null;
}

export interface TranscribeResult {
  transcript: string;
  name: string;
  company: string;
  email: string;
  event: string;
  summary: string;
  tags: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = "API error";
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function getHealth(): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>("/health");
}

export async function getEvents(): Promise<string[]> {
  return fetchJson<string[]>("/api/events");
}

export interface PaginatedLeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  counts_by_status: Record<string, number>;
}

export async function getLeads(filters?: {
  q?: string;
  event?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}): Promise<PaginatedLeadsResponse> {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.event && filters.event !== "all") params.set("event", filters.event);
  if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.page_size) params.set("page_size", String(filters.page_size));
  if (filters?.sort_by) params.set("sort_by", filters.sort_by);
  if (filters?.sort_order) params.set("sort_order", filters.sort_order);

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<PaginatedLeadsResponse>(`/api/leads${queryStr}`);
}

export async function getLead(id: string): Promise<Lead> {
  return fetchJson<Lead>(`/api/leads/${id}`);
}

export async function createLead(lead: LeadCreateInput): Promise<Lead> {
  return fetchJson<Lead>("/api/leads", {
    method: "POST",
    body: JSON.stringify(lead),
  });
}

export async function updateLead(id: string, lead: LeadUpdateInput): Promise<Lead> {
  return fetchJson<Lead>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(lead),
  });
}

export async function deleteLead(id: string): Promise<{ ok: boolean; message: string }> {
  return fetchJson<{ ok: boolean; message: string }>(`/api/leads/${id}`, {
    method: "DELETE",
  });
}

export async function summarizeLead(id: string): Promise<Lead> {
  return fetchJson<Lead>(`/api/leads/${id}/summarize`, {
    method: "POST",
  });
}

export async function draftFollowup(id: string): Promise<Lead> {
  return fetchJson<Lead>(`/api/leads/${id}/draft-followup`, {
    method: "POST",
  });
}

export async function transcribeAudio(audioBlob: Blob, mimeType: string): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, `recording.${mimeType.includes("mp4") ? "mp4" : "webm"}`);

  const res = await fetch(`${API_BASE}/api/leads/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = "Transcription failed";
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}
