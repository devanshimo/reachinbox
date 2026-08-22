import axios from "axios";

const authApi = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authApi.get<AuthUser>(
    "/auth/me",
  );

  return response.data;
}

export async function logout(): Promise<void> {
  await authApi.post("/auth/logout");
}