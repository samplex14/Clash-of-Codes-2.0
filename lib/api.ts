import { env } from "@/lib/env";

const buildUrl = (path: string): string => {
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}${cleanedPath}`;
};

interface RequestInitWithJson extends RequestInit {
  json?: unknown;
}

export interface SubmitPhase1Response {
  success: boolean;
  score: number;
  total: number;
  year: string;
}

export const apiRequest = async <T>(path: string, init: RequestInitWithJson = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body
  });

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
};
