import axios from "axios";

const API_URL = "https://reachinbox-assignment-production-a5db.up.railway.app/api";

export interface Sender {
  id: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
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

export async function getSenders(): Promise<Sender[]> {
  const response = await axios.get(
    `${API_URL}/senders`,
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
