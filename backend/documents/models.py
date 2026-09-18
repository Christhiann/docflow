"""Modelo de documento e transicoes de status."""

from __future__ import annotations

import uuid
from pathlib import Path

from django.conf import settings
from django.db import models
from django.utils import timezone


def document_upload_path(instance: "Document", filename: str) -> str:
    """Guarda o arquivo isolado por usuario, com nome unico."""
    suffix = Path(filename).suffix.lower()
    return f"documents/{instance.owner_id}/{uuid.uuid4().hex}{suffix}"


class DocumentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"


class Document(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to=document_upload_path)
    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.PENDING,
        db_index=True,
    )
    file_size = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.original_name} ({self.status})"

    # --- Transicoes de status ---------------------------------------------
    # Mantidas no modelo para que a task fique enxuta e facil de testar.

    def mark_processing(self) -> None:
        self.status = DocumentStatus.PROCESSING
        self.error_message = ""
        self.save(update_fields=["status", "error_message", "updated_at"])

    def mark_completed(self, *, file_size: int, content_type: str) -> None:
        self.status = DocumentStatus.COMPLETED
        self.file_size = file_size
        self.content_type = content_type
        self.processed_at = timezone.now()
        self.error_message = ""
        self.save(
            update_fields=[
                "status",
                "file_size",
                "content_type",
                "processed_at",
                "error_message",
                "updated_at",
            ]
        )

    def mark_failed(self, message: str) -> None:
        self.status = DocumentStatus.FAILED
        self.error_message = message[:1000]
        self.processed_at = timezone.now()
        self.save(update_fields=["status", "error_message", "processed_at", "updated_at"])
