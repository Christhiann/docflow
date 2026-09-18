"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { uploadDocument } from "@/lib/api/documents";
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE_MB, validateUpload } from "@/lib/schemas";
import { formatFileSize } from "@/lib/utils";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadDialog({ isOpen, onClose, onUploaded }: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    const validationError = validateUpload(selected);
    setError(validationError);
    setFile(validationError ? null : selected);
  }

  function reset() {
    setFile(null);
    setError(null);
    setIsSending(false);
    setIsDragging(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!file) return;
    setIsSending(true);
    try {
      await uploadDocument(file);
      reset();
      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
      setIsSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title="Enviar documento" onClose={handleClose}>
      <div className="space-y-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded border border-dashed px-4 py-8 text-center ${
            isDragging ? "border-accent bg-accent-soft" : "border-line bg-paper"
          }`}
        >
          <UploadCloud className="h-6 w-6 text-muted" />
          <p className="text-sm text-ink">Arraste um arquivo ou clique para escolher</p>
          <p className="text-xs text-muted">
            {ALLOWED_EXTENSIONS.join(", ")} · até {MAX_UPLOAD_SIZE_MB} MB
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
        </div>

        {file && (
          <p className="text-sm text-ink">
            {file.name} <span className="text-muted">({formatFileSize(file.size)})</span>
          </p>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file} isLoading={isSending}>
            Enviar documento
          </Button>
        </div>
      </div>
    </Modal>
  );
}
