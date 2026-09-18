"""Regra do processamento simulado do documento.

Fica separada da task para poder ser testada isoladamente e para manter a
task responsavel apenas pela orquestracao (status + tratamento de erro).
"""

from __future__ import annotations

import mimetypes
import time
from dataclasses import dataclass

from django.conf import settings

from documents.models import Document


@dataclass(frozen=True)
class DocumentMetadata:
    file_size: int
    content_type: str


def extract_metadata(document: Document) -> DocumentMetadata:
    """Simula o processamento: aguarda um tempo e extrai metadados do arquivo.

    Em um projeto real, aqui entraria OCR, parsing, antivirus, etc.
    """
    if not document.file:
        raise ValueError("Documento sem arquivo associado.")

    time.sleep(settings.DOCUMENT_PROCESSING_DELAY_SECONDS)

    try:
        file_size = document.file.size
    except (FileNotFoundError, OSError) as exc:
        raise ValueError("Arquivo nao encontrado no storage.") from exc

    content_type = document.content_type or (
        mimetypes.guess_type(document.original_name)[0] or "application/octet-stream"
    )

    return DocumentMetadata(file_size=file_size, content_type=content_type)
