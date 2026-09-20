export interface LeadData {
  name: string;
  email: string;
  company?: string;
  volume?: string;
  source?: string;
  [key: string]: any;
}

export function validateLead(body: any): { ok: boolean; error?: string; data?: LeadData } {
  if (!body || !body.email || typeof body.email !== "string") {
    return { ok: false, error: "Valid email is required." };
  }
  return {
    ok: true,
    data: {
      name: body.name || "Unknown",
      email: body.email,
      company: body.company || "Unknown",
      volume: body.volume,
      source: body.source,
      ...body,
    },
  };
}
