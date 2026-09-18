"""Endpoints de documentos."""

from django.db import transaction
from django.db.models import QuerySet
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from documents.filters import DocumentFilter
from documents.models import Document
from documents.permissions import IsOwner
from documents.serializers import DocumentCreateSerializer, DocumentSerializer
from documents.tasks import process_document


@extend_schema_view(
    list=extend_schema(
        tags=["documents"],
        summary="Lista os documentos do usuario",
        parameters=[
            OpenApiParameter("status", str, description="PENDING, PROCESSING, COMPLETED ou FAILED"),
            OpenApiParameter("ordering", str, description="created_at ou -created_at"),
        ],
    ),
    create=extend_schema(tags=["documents"], summary="Envia um documento para processamento"),
    retrieve=extend_schema(tags=["documents"], summary="Detalhe de um documento"),
    destroy=extend_schema(tags=["documents"], summary="Remove um documento"),
)
class DocumentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_class = DocumentFilter
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self) -> QuerySet[Document]:
        # Isolamento por usuario feito no queryset: nenhuma rota enxerga
        # documentos de terceiros, nem por id direto.
        if getattr(self, "swagger_fake_view", False) or self.request.user.is_anonymous:
            return Document.objects.none()
        return Document.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        return DocumentCreateSerializer if self.action == "create" else DocumentSerializer

    def perform_create(self, serializer: DocumentCreateSerializer) -> None:
        document = serializer.save()
        # Só publica na fila depois do commit: evita a task rodar antes do
        # registro existir no banco.
        transaction.on_commit(lambda: process_document.delay(document.id))

    def perform_destroy(self, instance: Document) -> None:
        instance.file.delete(save=False)
        instance.delete()
