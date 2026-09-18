"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listDocuments, type ListDocumentsParams } from "@/lib/api/documents";
import { isActiveStatus, type Document, type PaginatedResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

interface UseDocumentsResult {
  data: PaginatedResponse<Document> | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Busca a lista de documentos e mantém o polling enquanto houver documentos
 * em processamento — assim o status acompanha o worker do Celery.
 */
export function useDocuments(params: ListDocumentsParams): UseDocumentsResult {
  const [data, setData] = useState<PaginatedResponse<Document> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const key = JSON.stringify(params);

  const fetchDocuments = useCallback(async () => {
    try {
      setData(await listDocuments(paramsRef.current));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar documentos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void fetchDocuments();
  }, [key, fetchDocuments]);

  useEffect(() => {
    const hasActive = data?.results.some((item) => isActiveStatus(item.status)) ?? false;
    if (!hasActive) return;
    const timer = setInterval(() => void fetchDocuments(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [data, fetchDocuments]);

  return { data, isLoading, error, reload: fetchDocuments };
}
