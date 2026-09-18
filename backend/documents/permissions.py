from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from documents.models import Document


class IsOwner(permissions.BasePermission):
    """Garante no backend que o usuario so acessa os proprios documentos."""

    message = "Voce nao tem acesso a este documento."

    def has_object_permission(self, request: Request, view: APIView, obj: Document) -> bool:
        return obj.owner_id == request.user.id
