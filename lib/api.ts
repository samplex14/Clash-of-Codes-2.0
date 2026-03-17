import { env } from "@/lib/env";

const buildUrl = (path: string): string => {
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  return `${env.NEXT_PUBLIC_SOCKET_URL}${cleanedPath}`;
};

interface RequestInitWithJson extends RequestInit {
  json?: unknown;
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
