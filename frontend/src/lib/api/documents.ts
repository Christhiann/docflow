import { apiRequest } from "@/lib/api/client";
import type { Document, DocumentStatus, PaginatedResponse } from "@/lib/types";

export interface ListDocumentsParams {
  status?: DocumentStatus | "ALL";
  page?: number;
  pageSize?: number;
  ordering?: "created_at" | "-created_at";
}

export function listDocuments(
  params: ListDocumentsParams = {},
): Promise<PaginatedResponse<Document>> {
  return apiRequest<PaginatedResponse<Document>>("/documents/", {
    query: {
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      page: params.page ? String(params.page) : undefined,
      page_size: params.pageSize ? String(params.pageSize) : undefined,
      ordering: params.ordering,
    },
  });
}

export function getDocument(id: number): Promise<Document> {
  return apiRequest<Document>(`/documents/${id}/`);
}

export function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<Document>("/documents/", { method: "POST", body: formData });
}

export function deleteDocument(id: number): Promise<void> {
  return apiRequest<void>(`/documents/${id}/`, { method: "DELETE" });
}
