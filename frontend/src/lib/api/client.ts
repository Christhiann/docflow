/**
 * Camada única de comunicação com a API.
 * Guarda os tokens, injeta o header Authorization e renova o access token
 * automaticamente quando ele expira.
 */

import type { AuthTokens } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const ACCESS_KEY = "docflow.access";
const REFRESH_KEY = "docflow.refresh";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStorage = {
  get access(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  save(tokens: AuthTokens): void {
    window.localStorage.setItem(ACCESS_KEY, tokens.access);
    window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  saveAccess(access: string): void {
    window.localStorage.setItem(ACCESS_KEY, access);
  },
  clear(): void {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PATCH";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_URL.replace(/\/$/, "")}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload) return payload;
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const detail = data.detail ?? data.non_field_errors;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && typeof detail[0] === "string") return detail[0];
    const first = Object.values(data)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  if (status === 401) return "Sessão expirada. Entre novamente.";
  return "Não foi possível concluir a operação. Tente de novo.";
}

function extractFieldErrors(payload: unknown): Record<string, string[]> {
  if (!payload || typeof payload !== "object") return {};
  const result: Record<string, string[]> = {};
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      result[key] = value as string[];
    }
  });
  return result;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.refresh;
  if (!refresh) return null;

  const response = await fetch(buildUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    tokenStorage.clear();
    return null;
  }

  const data = (await response.json()) as { access: string };
  tokenStorage.saveAccess(data.access);
  return data.access;
}

async function send(path: string, options: RequestOptions, retry: boolean): Promise<Response> {
  const { method = "GET", body, auth = true, query } = options;
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && tokenStorage.access) headers.Authorization = `Bearer ${tokenStorage.access}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 401 && auth && retry) {
    const access = await refreshAccessToken();
    if (access) return send(path, options, false);
  }

  return response;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options, true);

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      extractFieldErrors(payload),
    );
  }

  return payload as T;
}
