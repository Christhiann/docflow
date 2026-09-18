"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document } from "@/lib/types";
import { formatDateTime, formatFileSize } from "@/lib/utils";

interface DocumentsTableProps {
  documents: Document[];
  isLoading?: boolean;
  onDelete?: (document: Document) => void;
  deletingId?: number | null;
}

export function DocumentsTable({
  documents,
  isLoading = false,
  onDelete,
  deletingId = null,
}: DocumentsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="px-4 py-2.5 font-medium">Documento</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Tamanho</th>
            <th className="px-4 py-2.5 font-medium">Enviado em</th>
            <th className="px-4 py-2.5 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-b border-line/70 last:border-0">
              <td className="max-w-[260px] truncate px-4 py-3">
                <Link
                  href={`/documents/${document.id}`}
                  className="font-medium text-ink hover:text-accent"
                >
                  {document.original_name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={document.status} />
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">
                {formatFileSize(document.file_size)}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">
                {formatDateTime(document.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/documents/${document.id}`} className="text-accent hover:underline">
                    Detalhes
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(document)}
                      disabled={deletingId === document.id}
                      aria-label={`Excluir ${document.original_name}`}
                      className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
