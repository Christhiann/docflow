export type DocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface Document {
  id: number;
  original_name: string;
  file_url: string | null;
  status: DocumentStatus;
  file_size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  error_message: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

export function isActiveStatus(status: DocumentStatus): boolean {
  return status === "PENDING" || status === "PROCESSING";
}
