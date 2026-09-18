"use client";

import { useState } from "react";

import { DocumentsTable } from "@/components/documents-table";
import { UploadDialog } from "@/components/upload-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { statusLabel } from "@/components/status-badge";
import { deleteDocument } from "@/lib/api/documents";
import { DOCUMENT_STATUSES, type Document, type DocumentStatus } from "@/lib/types";
import { useDocuments } from "@/lib/use-documents";
import { cn } from "@/lib/utils";

type Filter = DocumentStatus | "ALL";

const PAGE_SIZE = 10;

export default function DocumentsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, reload } = useDocuments({
    status: filter,
    page,
    pageSize: PAGE_SIZE,
  });

  const documents = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function applyFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  async function handleDelete(document: Document) {
    if (!window.confirm(`Excluir "${document.original_name}"?`)) return;
    setActionError(null);
    setDeletingId(document.id);
    try {
      await deleteDocument(document.id);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Documentos</h1>
          <p className="text-sm text-muted">
            {data ? `${data.count} documento(s)` : "Carregando…"}
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>Enviar documento</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", ...DOCUMENT_STATUSES] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => applyFilter(option)}
            className={cn(
              "rounded border px-3 py-1.5 text-sm transition-colors",
              filter === option
                ? "border-accent bg-accent-soft text-accent-dark"
                : "border-line bg-white text-muted hover:text-ink",
            )}
          >
            {option === "ALL" ? "Todos" : statusLabel(option)}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      <section className="rounded border border-line bg-white">
        {!isLoading && documents.length === 0 ? (
          <EmptyState
            title="Nada para mostrar com esse filtro"
            description="Envie um documento ou selecione outro status."
            actionLabel="Enviar documento"
            onAction={() => setIsUploadOpen(true)}
          />
        ) : (
          <DocumentsTable
            documents={documents}
            isLoading={isLoading}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-muted">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      <UploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => {
          setPage(1);
          void reload();
        }}
      />
    </div>
  );
}
