from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Paginacao padrao da API: 10 itens, ajustavel via ?page_size."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
