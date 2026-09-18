"""Fixtures compartilhadas dos testes."""

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture(autouse=True)
def media_root(settings, tmp_path):
    """Isola uploads dos testes em um diretorio temporario."""
    settings.MEDIA_ROOT = tmp_path / "media"
    return settings.MEDIA_ROOT


@pytest.fixture(autouse=True)
def fast_processing(settings):
    """Sem delay artificial durante os testes."""
    settings.DOCUMENT_PROCESSING_DELAY_SECONDS = 0


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        username="alice", email="alice@example.com", password="StrongPass!234"
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        username="bob", email="bob@example.com", password="StrongPass!234"
    )


@pytest.fixture
def auth_client(api_client: APIClient, user: User) -> APIClient:
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def upload_file() -> SimpleUploadedFile:
    return SimpleUploadedFile("relatorio.txt", b"conteudo de teste", content_type="text/plain")
