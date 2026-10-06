export function parseEmailDraft(rawDraft: string | null | undefined): {
  subject: string;
  body: string;
} {
  if (!rawDraft) {
    return { subject: "", body: "" };
  }

  const trimmed = rawDraft.trim();
  const subjectPrefix = "Subject:";

  if (trimmed.startsWith(subjectPrefix)) {
    const lines = trimmed.split("\n");
    const subjectLine = lines[0].replace(subjectPrefix, "").trim();
    const bodyLines = lines.slice(1).join("\n").trim();
    return {
      subject: subjectLine,
      body: bodyLines,
    };
  }

  return {
    subject: "Following up from our conversation",
    body: trimmed,
  };
}

export function buildGmailComposeUrl(toEmail: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: toEmail || "",
    su: subject || "",
    body: body || "",
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function buildMailtoUrl(toEmail: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);

  const query = params.toString() ? `?${params.toString()}` : "";
  return `mailto:${encodeURIComponent(toEmail || "")}${query}`;
}
