"""Validacao de upload: extensao permitida e tamanho maximo."""

from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers


def validate_upload(file: UploadedFile) -> UploadedFile:
    extension = Path(file.name).suffix.lower().lstrip(".")
    allowed = [ext.lower() for ext in settings.ALLOWED_UPLOAD_EXTENSIONS]

    if extension not in allowed:
        raise serializers.ValidationError(
            f"Extensao '.{extension}' nao permitida. Use: {', '.join(allowed)}."
        )

    if file.size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise serializers.ValidationError(
            f"Arquivo maior que o limite de {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    if file.size == 0:
        raise serializers.ValidationError("O arquivo esta vazio.")

    return file
