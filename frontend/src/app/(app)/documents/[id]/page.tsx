"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDocument, getDocument } from "@/lib/api/documents";
import { isActiveStatus, type Document } from "@/lib/types";
import { formatDateTime, formatFileSize } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const documentId = Number(params.id);

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setDocument(await getDocument(documentId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Documento não encontrado.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!document || !isActiveStatus(document.status)) return;
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [document, load]);

  async function handleDelete() {
    if (!window.confirm("Excluir este documento?")) return;
    setIsDeleting(true);
    try {
      await deleteDocument(documentId);
      router.replace("/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error || !document) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error ?? "Documento não encontrado."}</Alert>
        <Link href="/documents" className="text-sm text-accent hover:underline">
          Voltar para documentos
        </Link>
      </div>
    );
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: "Tamanho", value: formatFileSize(document.file_size) },
    { label: "Tipo", value: document.content_type || "—" },
    { label: "Enviado em", value: formatDateTime(document.created_at) },
    { label: "Processado em", value: formatDateTime(document.processed_at) },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Documentos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {document.original_name}
          </h1>
          <StatusBadge status={document.status} />
        </div>
        <div className="flex gap-2">
          {document.file_url && (
            <a
              href={document.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
            >
              Baixar arquivo
            </a>
          )}
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Excluir
          </Button>
        </div>
      </div>

      {document.status === "FAILED" && document.error_message && (
        <Alert tone="error">O processamento falhou: {document.error_message}</Alert>
      )}

      {isActiveStatus(document.status) && (
        <Alert tone="info">
          O worker do Celery está cuidando deste arquivo. O status atualiza sozinho.
        </Alert>
      )}

      <dl className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="bg-white px-4 py-3">
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
