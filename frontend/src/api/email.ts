import axios from "axios";

const API_URL = "https://reachinbox-assignment-production-a5db.up.railway.app/api";

export interface Email {
  id: string;
  campaignId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status:
    | "SCHEDULED"
    | "SENT"
    | "PROCESSING"
    | "FAILED";
  attempts: number;
  messageId: string | null;
  error: string | null;
}

export interface CreateCampaignPayload {
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export async function getEmails(
  status: Email["status"],
): Promise<Email[]> {
  const response = await axios.get<Email[]>(
    `${API_URL}/emails?status=${status}`,
    {
      withCredentials: true,
    },
  );

  return response.data;
}

export async function createCampaign(
  payload: CreateCampaignPayload,
) {
  const response = await axios.post(
    `${API_URL}/campaigns`,
    payload,
    {
      withCredentials: true,
    },
  );

  return response.data;
}