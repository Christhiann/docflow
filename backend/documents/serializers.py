"""Serializers de documentos."""

from rest_framework import serializers

from documents.models import Document
from documents.validators import validate_upload


class DocumentSerializer(serializers.ModelSerializer):
    """Leitura de documento (list/retrieve)."""

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "original_name",
            "file_url",
            "status",
            "file_size",
            "content_type",
            "created_at",
            "updated_at",
            "processed_at",
            "error_message",
        ]
        read_only_fields = fields

    def get_file_url(self, obj: Document) -> str | None:
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class DocumentCreateSerializer(serializers.ModelSerializer):
    """Upload de documento. O owner vem do request, nunca do payload."""

    file = serializers.FileField(validators=[validate_upload])

    class Meta:
        model = Document
        fields = ["id", "file", "original_name", "status", "created_at"]
        read_only_fields = ["id", "original_name", "status", "created_at"]

    def create(self, validated_data: dict) -> Document:
        upload = validated_data["file"]
        return Document.objects.create(
            owner=self.context["request"].user,
            file=upload,
            original_name=upload.name[:255],
            content_type=getattr(upload, "content_type", "") or "",
            file_size=upload.size,
        )
