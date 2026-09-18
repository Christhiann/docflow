"""Testes de autenticacao: registro, login, rota protegida e token invalido."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

pytestmark = pytest.mark.django_db


def test_register_creates_user_with_hashed_password(api_client):
    payload = {
        "username": "carol",
        "email": "carol@example.com",
        "password": "StrongPass!234",
        "password_confirm": "StrongPass!234",
    }

    response = api_client.post(reverse("register"), payload, format="json")

    assert response.status_code == 201
    created = User.objects.get(username="carol")
    assert created.password != payload["password"]
    assert created.check_password(payload["password"])


def test_register_rejects_mismatched_passwords(api_client):
    payload = {
        "username": "carol",
        "email": "carol@example.com",
        "password": "StrongPass!234",
        "password_confirm": "OutraSenha!234",
    }

    response = api_client.post(reverse("register"), payload, format="json")

    assert response.status_code == 400
    assert "password_confirm" in response.data


def test_login_returns_access_and_refresh_tokens(api_client, user):
    response = api_client.post(
        reverse("token_obtain_pair"),
        {"username": user.username, "password": "StrongPass!234"},
        format="json",
    )

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


def test_me_requires_authentication(api_client):
    assert api_client.get(reverse("me")).status_code == 401


def test_me_returns_current_user(api_client, user):
    tokens = api_client.post(
        reverse("token_obtain_pair"),
        {"username": user.username, "password": "StrongPass!234"},
        format="json",
    ).data
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    response = api_client.get(reverse("me"))

    assert response.status_code == 200
    assert response.data["username"] == user.username


def test_invalid_token_is_rejected(api_client):
    api_client.credentials(HTTP_AUTHORIZATION="Bearer token-invalido")

    assert api_client.get(reverse("me")).status_code == 401
