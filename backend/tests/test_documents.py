"""Testes da API de documentos."""

from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from documents.models import Document, DocumentStatus

pytestmark = pytest.mark.django_db


def create_document(owner, *, status=DocumentStatus.PENDING, name="arquivo.txt") -> Document:
    return Document.objects.create(
        owner=owner,
        original_name=name,
        file=SimpleUploadedFile(name, b"conteudo"),
        status=status,
        file_size=8,
        content_type="text/plain",
    )


def test_authenticated_user_uploads_document(auth_client, user, upload_file):
    with patch("documents.views.process_document.delay") as delay:
        response = auth_client.post(
            reverse("document-list"), {"file": upload_file}, format="multipart"
        )

    assert response.status_code == 201
    document = Document.objects.get(owner=user)
    assert document.original_name == "relatorio.txt"
    assert document.status == DocumentStatus.PENDING
    delay.assert_called_once_with(document.id)


def test_upload_requires_authentication(api_client, upload_file):
    response = api_client.post(reverse("document-list"), {"file": upload_file}, format="multipart")

    assert response.status_code == 401


def test_upload_rejects_unsupported_extension(auth_client):
    forbidden = SimpleUploadedFile("script.exe", b"binario", content_type="application/exe")

    response = auth_client.post(reverse("document-list"), {"file": forbidden}, format="multipart")

    assert response.status_code == 400
    assert "file" in response.data


def test_list_returns_only_own_documents(auth_client, user, other_user):
    create_document(user, name="meu.txt")
    create_document(other_user, name="do-bob.txt")

    response = auth_client.get(reverse("document-list"))

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["original_name"] == "meu.txt"


def test_user_cannot_read_document_of_another_user(auth_client, other_user):
    foreign = create_document(other_user)

    response = auth_client.get(reverse("document-detail", args=[foreign.id]))

    assert response.status_code == 404


def test_user_cannot_delete_document_of_another_user(auth_client, other_user):
    foreign = create_document(other_user)

    response = auth_client.delete(reverse("document-detail", args=[foreign.id]))

    assert response.status_code == 404
    assert Document.objects.filter(pk=foreign.id).exists()


def test_user_deletes_own_document(auth_client, user):
    document = create_document(user)

    response = auth_client.delete(reverse("document-detail", args=[document.id]))

    assert response.status_code == 204
    assert not Document.objects.filter(pk=document.id).exists()


def test_filter_by_status(auth_client, user):
    create_document(user, status=DocumentStatus.COMPLETED, name="ok.txt")
    create_document(user, status=DocumentStatus.FAILED, name="erro.txt")

    response = auth_client.get(reverse("document-list"), {"status": "COMPLETED"})

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["original_name"] == "ok.txt"


def test_list_is_ordered_by_creation_date_desc(auth_client, user):
    create_document(user, name="antigo.txt")
    create_document(user, name="novo.txt")

    response = auth_client.get(reverse("document-list"))

    names = [item["original_name"] for item in response.data["results"]]
    assert names == ["novo.txt", "antigo.txt"]


def test_health_endpoint_is_public(api_client):
    response = api_client.get(reverse("health"))

    assert response.status_code == 200
    assert response.data == {"status": "ok"}
