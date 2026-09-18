"""Testes do processamento assincrono."""

from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from documents.models import Document, DocumentStatus
from documents.tasks import process_document

pytestmark = pytest.mark.django_db


@pytest.fixture
def pending_document(user) -> Document:
    return Document.objects.create(
        owner=user,
        original_name="contrato.txt",
        file=SimpleUploadedFile("contrato.txt", b"conteudo do contrato"),
        status=DocumentStatus.PENDING,
    )


def test_upload_schedules_processing_after_commit(
    auth_client, upload_file, django_capture_on_commit_callbacks
):
    with patch("documents.views.process_document.delay") as delay:
        with django_capture_on_commit_callbacks(execute=True):
            response = auth_client.post(
                reverse("document-list"), {"file": upload_file}, format="multipart"
            )

    assert response.status_code == 201
    delay.assert_called_once()


def test_processing_marks_document_as_completed(pending_document):
    result = process_document(pending_document.id)

    pending_document.refresh_from_db()
    assert result == "completed"
    assert pending_document.status == DocumentStatus.COMPLETED
    assert pending_document.processed_at is not None
    assert pending_document.file_size > 0
    assert pending_document.error_message == ""


def test_processing_failure_marks_document_as_failed(pending_document):
    with patch(
        "documents.tasks.extract_metadata", side_effect=ValueError("arquivo corrompido")
    ):
        result = process_document(pending_document.id)

    pending_document.refresh_from_db()
    assert result == "failed"
    assert pending_document.status == DocumentStatus.FAILED
    assert "arquivo corrompido" in pending_document.error_message


def test_task_ignores_missing_document():
    assert process_document(999999) == "not_found"
