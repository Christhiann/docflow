"""Views de autenticacao e perfil do usuario."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from accounts.serializers import RegisterSerializer, UserSerializer

User = get_user_model()


@extend_schema(tags=["auth"], summary="Cria uma nova conta")
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_scope = "register"


@extend_schema(tags=["accounts"], summary="Retorna o usuario autenticado")
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user
