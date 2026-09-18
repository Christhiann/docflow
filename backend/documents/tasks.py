"""Tasks Celery do app de documentos."""

from __future__ import annotations

import logging

from celery import shared_task

from documents.models import Document
from documents.services import extract_metadata

logger = logging.getLogger(__name__)


@shared_task(name="documents.process_document")
def process_document(document_id: int) -> str:
    """Processa um documento em background e atualiza o status.

    PENDING -> PROCESSING -> COMPLETED | FAILED
    """
    document = Document.objects.filter(pk=document_id).first()
    if document is None:
        logger.warning("Documento %s nao encontrado; task ignorada.", document_id)
        return "not_found"

    document.mark_processing()

    try:
        metadata = extract_metadata(document)
    except Exception as exc:  # noqa: BLE001 - qualquer falha vira status FAILED
        logger.exception("Falha ao processar documento %s", document_id)
        document.mark_failed(str(exc))
        return "failed"

    document.mark_completed(file_size=metadata.file_size, content_type=metadata.content_type)
    logger.info("Documento %s processado com sucesso.", document_id)
    return "completed"
