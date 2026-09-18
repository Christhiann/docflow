"use client";

import { useState } from "react";
import Link from "next/link";

import { DocumentsTable } from "@/components/documents-table";
import { StatTile } from "@/components/stat-tile";
import { UploadDialog } from "@/components/upload-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDocuments } from "@/lib/use-documents";
import type { Document, DocumentStatus } from "@/lib/types";

function countByStatus(documents: Document[], status: DocumentStatus): number {
  return documents.filter((document) => document.status === status).length;
}

export default function DashboardPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { data, isLoading, error, reload } = useDocuments({ pageSize: 100 });

  const documents = data?.results ?? [];
  const recent = documents.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Visão geral</h1>
          <p className="text-sm text-muted">Acompanhe o processamento dos seus documentos.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>Enviar documento</Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total" value={data?.count ?? 0} isLoading={isLoading} />
        <StatTile
          label="Processados"
          value={countByStatus(documents, "COMPLETED")}
          accent="emerald"
          isLoading={isLoading}
        />
        <StatTile
          label="Em processamento"
          value={
            countByStatus(documents, "PROCESSING") + countByStatus(documents, "PENDING")
          }
          accent="amber"
          isLoading={isLoading}
        />
        <StatTile
          label="Com erro"
          value={countByStatus(documents, "FAILED")}
          accent="red"
          isLoading={isLoading}
        />
      </div>

      <section className="rounded border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Documentos recentes</h2>
          <Link href="/documents" className="text-sm text-accent hover:underline">
            Ver todos
          </Link>
        </div>

        {!isLoading && recent.length === 0 ? (
          <EmptyState
            title="Nenhum documento por aqui ainda"
            description="Envie um arquivo para ver o processamento assíncrono em ação."
            actionLabel="Enviar documento"
            onAction={() => setIsUploadOpen(true)}
          />
        ) : (
          <DocumentsTable documents={recent} isLoading={isLoading} />
        )}
      </section>

      <UploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={reload}
      />
    </div>
  );
}
